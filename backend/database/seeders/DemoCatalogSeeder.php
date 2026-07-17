<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $instructors = collect(['marakshilaila@gmail.com', 'yousef@gmail.com'])
            ->map(fn (string $email) => User::where('email', $email)->first());

        if ($instructors->contains(fn (?User $user) => ! $user || ! $user->hasRole('instructor'))) {
            throw new RuntimeException('Both configured instructor accounts are required.');
        }

        $admin = $instructors->first();
        $admin->update([
            'instructor_status' => 'approved',
            'instructor_approved_at' => now(),
            'instructor_approved_by' => $admin->id,
            'instructor_rejection_reason' => null,
        ]);

        $catalog = [
            ['Programming', 'programming', 'Build practical software development skills.', [
                ['Modern Web Development', 'modern-web-development', 'Learn the foundations of accessible, responsive web applications.', 'beginner', 180],
                ['Laravel API Development', 'laravel-api-development', 'Design secure and maintainable REST APIs with Laravel.', 'intermediate', 240],
            ]],
            ['Business', 'business', 'Develop useful business and leadership capabilities.', [
                ['Digital Marketing Essentials', 'digital-marketing-essentials', 'Plan effective digital campaigns using measurable strategies.', 'beginner', 150],
                ['Project Management Fundamentals', 'project-management-fundamentals', 'Organize teams, scope, schedules, risks, and delivery.', 'beginner', 165],
            ]],
            ['Design', 'design', 'Create thoughtful and effective digital experiences.', [
                ['UI UX Design Foundations', 'ui-ux-design-foundations', 'Apply research, hierarchy, accessibility, and interaction principles.', 'beginner', 190],
            ]],
            ['Languages', 'languages', 'Communicate confidently in a global learning environment.', [
                ['Professional English Communication', 'professional-english-communication', 'Improve practical English for study and the workplace.', 'intermediate', 140],
            ]],
        ];

        DB::transaction(function () use ($catalog, $instructors): void {
            $courseIndex = 0;

            foreach ($catalog as [$name, $slug, $description, $courses]) {
                $category = Category::updateOrCreate(
                    ['slug' => $slug],
                    ['name' => $name, 'description' => $description, 'is_active' => true]
                );

                foreach ($courses as [$title, $courseSlug, $summary, $level, $duration]) {
                    $instructor = $instructors[$courseIndex % $instructors->count()];
                    $courseIndex++;
                    $course = Course::updateOrCreate(
                        ['slug' => $courseSlug],
                        [
                            'instructor_id' => $instructor->id,
                            'category_id' => $category->id,
                            'title' => $title,
                            'short_description' => $summary,
                            'description' => $summary.' This course combines concise explanations, guided examples, and practical activities so learners can apply each concept with confidence.',
                            'level' => $level,
                            'language' => 'English',
                            'duration' => $duration,
                            'price' => 0,
                            'currency' => 'USD',
                            'type' => 'free',
                            'status' => 'published',
                            'reviewed_by' => User::role('admin')->value('id'),
                            'reviewed_at' => now(),
                            'published_at' => now(),
                        ]
                    );

                    $this->seedCurriculum($course);
                }
            }
        });
    }

    private function seedCurriculum(Course $course): void
    {
        $sections = [
            ['Getting Started', 'Understand the course goals and essential foundations.', ['Course Introduction', 'Core Concepts']],
            ['Practice and Application', 'Turn the key concepts into practical skills.', ['Guided Practice', 'Next Steps']],
        ];

        foreach ($sections as $sectionIndex => [$title, $description, $lessons]) {
            $section = CourseSection::updateOrCreate(
                ['course_id' => $course->id, 'position' => $sectionIndex + 1],
                ['title' => $title, 'description' => $description]
            );

            foreach ($lessons as $lessonIndex => $lessonTitle) {
                $position = $lessonIndex + 1;
                Lesson::updateOrCreate(
                    ['course_section_id' => $section->id, 'position' => $position],
                    [
                        'title' => $lessonTitle,
                        'slug' => str($lessonTitle)->slug(),
                        'description' => "A focused lesson covering {$lessonTitle}.",
                        'text_content' => "<h2>{$lessonTitle}</h2><p>Explore the key ideas in this lesson, follow the examples, and complete the suggested practice before continuing.</p>",
                        'content_type' => 'text',
                        'duration' => 20,
                        'is_preview' => $sectionIndex === 0 && $lessonIndex === 0,
                        'is_published' => true,
                        'content_updated_at' => now(),
                    ]
                );
            }
        }
    }
}
