<?php

namespace App\Observers;

use App\Models\Category;
use App\Models\Course;
use App\Services\PerformanceCache;
use Illuminate\Database\Eloquent\Model as EloquentModel;

class AnalyticsCacheObserver
{
    public function saved(EloquentModel $model): void
    {
        $this->invalidate($model);
    }

    public function deleted(EloquentModel $model): void
    {
        $this->invalidate($model);
    }

    private function invalidate(EloquentModel $model): void
    {
        PerformanceCache::flushAdminAnalytics();

        if ($model instanceof Course || $model instanceof Category) {
            PerformanceCache::flushPublicCatalog();
        }
    }
}
