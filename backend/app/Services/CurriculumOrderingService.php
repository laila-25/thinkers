<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CurriculumOrderingService
{
    public function sections(Course $course, array $ids): void
    {
        $this->assertExact($course->sections()->pluck('id')->all(), $ids, 'sections');
        DB::transaction(function () use ($ids): void {
            foreach ($ids as $index => $id) {
                CourseSection::whereKey($id)->update(['position' => 100000 + $index]);
            }
            foreach ($ids as $index => $id) {
                CourseSection::whereKey($id)->update(['position' => $index + 1]);
            }
        });
    }

    public function lessons(CourseSection $section, array $ids): void
    {
        $this->assertExact($section->lessons()->pluck('id')->all(), $ids, 'lessons');
        DB::transaction(function () use ($ids): void {
            foreach ($ids as $index => $id) {
                Lesson::whereKey($id)->update(['position' => 100000 + $index]);
            }
            foreach ($ids as $index => $id) {
                Lesson::whereKey($id)->update(['position' => $index + 1]);
            }
        });
    }

    private function assertExact(array $actual, array $provided, string $key): void
    {
        if (collect($actual)->sort()->values()->all() !== collect($provided)->sort()->values()->all()) {
            throw ValidationException::withMessages([$key => "Every {$key} item must appear exactly once."]);
        }
    }
}
