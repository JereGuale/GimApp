<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SupabaseStorage
{
    private string $projectUrl;
    private string $serviceKey;
    private string $bucket;

    public function __construct()
    {
        $this->projectUrl = rtrim(config('supabase.url', 'https://edogsfwdluaubsfdknul.supabase.co'), '/');
        $this->serviceKey = config('supabase.service_key', '');
        $this->bucket = config('supabase.storage_bucket', 'gym-images');
    }

    /**
     * Upload raw binary data to Supabase Storage using native cURL.
     * Returns the public URL or null on failure.
     */
    public function uploadBinary(string $path, string $data, string $mimeType = 'image/jpeg'): ?string
    {
        try {
            $url = "{$this->projectUrl}/storage/v1/object/{$this->bucket}/{$path}";

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_CUSTOMREQUEST => 'POST',
                CURLOPT_POSTFIELDS => $data,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_HTTPHEADER => [
                    "Authorization: Bearer {$this->serviceKey}",
                    "Content-Type: {$mimeType}",
                    "x-upsert: true",
                    "Content-Length: " . strlen($data),
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                Log::error('Supabase cURL error', ['error' => $curlError, 'path' => $path]);
                return null;
            }

            if ($httpCode === 200 || $httpCode === 201) {
                Log::info('Supabase upload success', ['path' => $path, 'status' => $httpCode]);
                return $this->publicUrl($path);
            }

            Log::error('Supabase upload failed', [
                'status' => $httpCode,
                'body' => $response,
                'path' => $path,
            ]);
            return null;
        }
        catch (\Exception $e) {
            Log::error('Supabase upload exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload file from a UploadedFile object.
     */
    public function uploadFile(\Illuminate\Http\UploadedFile $file, string $path): ?string
    {
        $data = file_get_contents($file->getRealPath());
        $mime = $file->getMimeType() ?? 'image/jpeg';
        return $this->uploadBinary($path, $data, $mime);
    }

    /**
     * Get public URL for a stored object.
     */
    public function publicUrl(string $path): string
    {
        return "{$this->projectUrl}/storage/v1/object/public/{$this->bucket}/{$path}";
    }

    /**
     * Check if service key is configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->serviceKey);
    }
}
