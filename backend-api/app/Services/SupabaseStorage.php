<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
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
     * Upload raw binary data to Supabase Storage.
     * Returns the public URL or null on failure.
     */
    public function uploadBinary(string $path, string $data, string $mimeType = 'image/jpeg'): ?string
    {
        try {
            $url = "{$this->projectUrl}/storage/v1/object/{$this->bucket}/{$path}";

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->serviceKey}",
                'Content-Type' => $mimeType,
                'x-upsert' => 'true',
            ])->withBody($data, $mimeType)->post($url);

            if ($response->successful() || $response->status() === 200) {
                return $this->publicUrl($path);
            }

            Log::error('Supabase upload failed', [
                'status' => $response->status(),
                'body' => $response->body(),
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
