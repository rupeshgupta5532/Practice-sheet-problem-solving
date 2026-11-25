import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  // Create patch release (active & published immediately)
  async create(dto: CreatePatchReleaseDto) {
    this.invalidateCache();
    return this.patchModel.create({
      ...dto,
      status: PatchStatus.PUBLISHED,
    });
  }

  // List all patch releases
  async findAll() {
    return this.patchModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  // Check if update is needed for the given currentVersion
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
    let targetPlatform: PatchPlatform = PatchPlatform.ALL;
    if (normPlatform === 'ANDROID') {
      targetPlatform = PatchPlatform.ANDROID;
    } else if (normPlatform === 'IOS') {
      targetPlatform = PatchPlatform.IOS;
    } else if (normPlatform === 'WEB') {
      targetPlatform = PatchPlatform.WEB;
    }

    const published = allPublished.filter((r) => {
      if (
        targetPlatform === PatchPlatform.ALL ||
        targetPlatform === PatchPlatform.WEB
      ) {
        return true;
      }
      return r.platform === targetPlatform || r.platform === PatchPlatform.ALL;
    });

    // Sort descending by version to get the latest release
    published.sort((a, b) => compareVersions(b.version, a.version));
    const latestRelease = published[0];

    if (
      !latestRelease ||
      compareVersions(latestRelease.version, currentVersion) <= 0
    ) {
      return {
        updateAvailable: false,
        updateRequired: false,
        updateType: null,
        currentVersion,
        latestVersion: latestRelease ? latestRelease.version : currentVersion,
      };
    }

    const isForce = latestRelease.updateType === UpdateType.FORCE;

    return {
      updateAvailable: true,
      updateRequired: isForce,
      updateType: latestRelease.updateType || UpdateType.OPTIONAL,
      currentVersion,
      minimumRequiredVersion: latestRelease.version,
      latestVersion: latestRelease.version,
      title: latestRelease.title,
      content: latestRelease.content,
    };
  }
}
