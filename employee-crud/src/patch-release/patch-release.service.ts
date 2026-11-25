import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreatePatchReleaseDto,
  PatchPlatform,
  PatchRelease,
  PatchReleaseDocument,
  PatchStatus,
  UpdateType,
} from './patch-release.entity';

export function compareVersions(v1: string, v2: string): number {
  const clean = (v: string) =>
    (v || '')
      .trim()
      .replace(/^version\s*/i, '')
      .replace(/^v/i, '')
      .trim()
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const p1 = clean(v1);
  const p2 = clean(v2);
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

@Injectable()
export class PatchReleaseService {
  constructor(
    @InjectModel(PatchRelease.name)
    private readonly patchModel: Model<PatchReleaseDocument>,
  ) {}

  private cachedPublishedReleases: {
    timestamp: number;
    data: PatchRelease[];
  } | null = null;
  private readonly CACHE_TTL_MS = 5000;

  private invalidateCache() {
    this.cachedPublishedReleases = null;
  }

  async create(dto: CreatePatchReleaseDto) {
    this.invalidateCache();
    return this.patchModel.create({
      ...dto,
      status: PatchStatus.PUBLISHED,
    });
  }

  async findAll() {
    return this.patchModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async checkUpdate(currentVersion: string, platform: string = 'ALL') {
    const now = Date.now();
    let allPublished: PatchRelease[];

    if (
      this.cachedPublishedReleases &&
      now - this.cachedPublishedReleases.timestamp < this.CACHE_TTL_MS
    ) {
      allPublished = this.cachedPublishedReleases.data;
    } else {
      allPublished = (await this.patchModel
        .find({ status: PatchStatus.PUBLISHED })
        .lean()
        .exec()) as PatchRelease[];
      this.cachedPublishedReleases = {
        timestamp: now,
        data: allPublished,
      };
    }

    const normPlatform = (platform || 'ALL').toUpperCase();

    const matching = allPublished.filter((r) => {
      if (normPlatform === 'ALL') return true;
      return (
        (r.platform as string) === normPlatform ||
        r.platform === PatchPlatform.ALL
      );
    });

    const getDocTime = (
      doc: PatchRelease & { _id?: Types.ObjectId | string },
    ): number => {
      if (doc?.createdAt) {
        const t = new Date(doc.createdAt).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      if (doc?._id) {
        if (doc._id instanceof Types.ObjectId) {
          return doc._id.getTimestamp().getTime();
        }
        if (typeof doc._id === 'string') {
          const t = parseInt(doc._id.substring(0, 8), 16) * 1000;
          if (!isNaN(t) && t > 0) return t;
        }
      }
      return 0;
    };

    matching.sort((a, b) => getDocTime(b) - getDocTime(a));

    const latestRelease = matching[0];

    const cleanCurrent = (currentVersion || '0.0.0').replace(/^v/i, '').trim();
    const cleanLatest = latestRelease
      ? latestRelease.version.replace(/^v/i, '').trim()
      : cleanCurrent;

    // When the header release version is different from the latest patch release, show popup
    if (!latestRelease || cleanCurrent === cleanLatest) {
      return {
        updateAvailable: false,
        updateRequired: false,
        updateType: null,
        currentVersion: cleanCurrent,
        latestVersion: cleanLatest,
      };
    }

    const isForce = latestRelease.updateType === UpdateType.FORCE;

    return {
      updateAvailable: true,
      updateRequired: isForce,
      updateType: latestRelease.updateType || UpdateType.OPTIONAL,
      currentVersion: cleanCurrent,
      minimumRequiredVersion: cleanLatest,
      latestVersion: cleanLatest,
      title: latestRelease.title,
      content: latestRelease.content,
      platform: latestRelease.platform,
    };
  }
}
