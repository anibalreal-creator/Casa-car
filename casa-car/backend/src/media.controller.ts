import { Controller, Post, Body } from '@nestjs/common';

/**
 * Demo: Presigned upload placeholder.
 * En producción, implementás firma real con AWS SDK y devolvés:
 * { uploadUrl, fileUrl }
 */
@Controller('media')
export class MediaController {
  @Post('presign')
  presign(@Body() body: { filename: string; contentType: string }){
    const key = `uploads/${Date.now()}-${body?.filename || 'file'}`;
    return {
      uploadUrl: `https://example-presigned.local/${key}`,
      fileUrl: `https://example-public.local/${key}`,
      note: "Placeholder: implementar AWS S3 presigned URLs."
    };
  }
}
