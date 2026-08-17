import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { AuthRequest } from "../types/auth.js";
import { uploadImageToCloudinary } from "../services/cloudinary.service.js";
import { getRequiredParam } from "../utils/requestParams.js";

const brandingSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  watermarkUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  footerAddress: z.string().max(500).optional(),
  authorizedSignUrl: z.string().url().nullable().optional()
});

export const getTenant = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId }
  });

  if (!tenant) throw new ApiError(404, "Tenant not found");

  res.json({ success: true, data: tenant });
});

export const updateBranding = asyncHandler(async (req: Request, res: Response) => {
  const auth = (req as AuthRequest).user!;
  const data = brandingSchema.parse(req.body);

  const tenant = await prisma.tenant.update({
    where: { id: auth.tenantId },
    data
  });

  res.json({
    success: true,
    message: "Tenant branding updated",
    data: tenant
  });
});


export const uploadTenantBrandingAsset = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = (req as AuthRequest).user!;

    if (!req.file) {
      throw new ApiError(
        400,
        "Image file is required"
      );
    }

    const assetType = getRequiredParam(req, "assetType");

    const allowedAssetTypes = [
      "logo",
      "watermark",
      "signature"
    ];

    if (
      !allowedAssetTypes.includes(assetType)
    ) {
      throw new ApiError(
        400,
        "Invalid branding asset type"
      );
    }

    const publicId =
      `tenant-${auth.tenantId}-${assetType}`;

    const imageUrl =
      await uploadImageToCloudinary(
        req.file.buffer,
        publicId
      );

    let updateData: {
      logoUrl?: string;
      watermarkUrl?: string;
      authorizedSignUrl?: string;
    };

    if (assetType === "logo") {
      updateData = {
        logoUrl: imageUrl
      };
    } else if (assetType === "watermark") {
      updateData = {
        watermarkUrl: imageUrl
      };
    } else {
      updateData = {
        authorizedSignUrl: imageUrl
      };
    }

    const tenant =
      await prisma.tenant.update({
        where: {
          id: auth.tenantId
        },

        data: updateData
      });

    res.json({
      success: true,

      message:
        `${assetType} uploaded successfully`,

      data: {
        assetType,
        imageUrl,
        tenant
      }
    });
  }
);