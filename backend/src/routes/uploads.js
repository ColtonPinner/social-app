const express = require('express');
const { requireAuth } = require('../auth');

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

router.use(requireAuth);

router.post('/image', async (req, res) => {
  const { contentType, dataBase64, fileName } = req.body || {};

  if (!contentType || !dataBase64) {
    return res.status(400).json({ error: 'contentType and dataBase64 are required' });
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'Unsupported image content type' });
  }

  const accountId = process.env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = process.env.CF_IMAGES_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(503).json({
      error: 'Cloudflare Images is not configured. Set CF_IMAGES_ACCOUNT_ID and CF_IMAGES_API_TOKEN.',
    });
  }

  try {
    const imageBuffer = Buffer.from(String(dataBase64), 'base64');

    if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_SIZE_BYTES) {
      return res.status(400).json({ error: 'Image must be between 1 byte and 5MB' });
    }

    const extension = contentType.split('/')[1] || 'jpg';
    const safeName = String(fileName || `upload-${Date.now()}.${extension}`).replace(/[^a-zA-Z0-9._-]/g, '_');

    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: contentType }), safeName);

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: formData,
      }
    );

    const payload = await uploadResponse.json();

    if (!uploadResponse.ok || !payload?.success) {
      return res.status(502).json({
        error: payload?.errors?.[0]?.message || 'Failed to upload image to Cloudflare Images',
      });
    }

    const image = payload.result;
    const imageUrl = Array.isArray(image?.variants) ? image.variants[0] : null;

    if (!imageUrl) {
      return res.status(502).json({ error: 'Cloudflare Images did not return a usable URL' });
    }

    return res.status(201).json({
      id: image.id,
      url: imageUrl,
      filename: image.filename,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process image upload' });
  }
});

module.exports = router;