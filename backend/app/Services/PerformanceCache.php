<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class PerformanceCache
{
    public const TTL_SECONDS = 300;

    public const ADMIN_DASHBOARD = 'analytics:admin:dashboard:v1';

    public const ADMIN_AI_USAGE = 'analytics:admin:ai-usage:v1';

    public const PUBLIC_CATEGORIES = 'catalog:categories:v1';

    private const CATALOG_VERSION = 'catalog:published:version';

    public static function flushAdminAnalytics(): void
    {
        Cache::forget(self::ADMIN_DASHBOARD);
        Cache::forget(self::ADMIN_AI_USAGE);
    }

    public static function flushPublicCatalog(): void
    {
        Cache::forget(self::PUBLIC_CATEGORIES);

        if (! Cache::has(self::CATALOG_VERSION)) {
            Cache::forever(self::CATALOG_VERSION, 1);

            return;
        }

        Cache::increment(self::CATALOG_VERSION);
    }

    public static function publicCatalogKey(array $parameters): string
    {
        $version = (int) Cache::rememberForever(self::CATALOG_VERSION, fn (): int => 1);

        return 'catalog:published:v'.$version.':'.hash('sha256', json_encode($parameters));
    }
}
