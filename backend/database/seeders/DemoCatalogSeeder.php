<?php

namespace Database\Seeders;

use App\Models\AIConversation;
use App\Models\AIMessage;
use App\Models\Answer;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Progress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoCatalogSeeder extends Seeder
{
    private const PASSWORD = 'Thinkers123!';

    public function run(): void
    {
        DB::transaction(function (): void {
            $admin = $this->seedAdmin();
            $instructors = $this->seedInstructors($admin);
            $categories = $this->seedCategories();
            $courses = $this->seedCourses($admin, $instructors, $categories);
            $students = $this->seedStudents();
            $this->seedLearningActivity($students, $courses);
        });
    }

    private function seedAdmin(): User
    {
        $admin = User::updateOrCreate(['email' => 'admin@thinkers.demo'], ['name' => 'Thinkers Demo Admin', 'password' => self::PASSWORD, 'email_verified_at' => now()]);
        $admin->assignRole('admin');

        return $admin;
    }

    private function seedInstructors(User $admin)
    {
        $people = [
            ['Dr. Lina Haddad', 'lina.haddad@thinkers.demo'], ['Omar Khalil', 'omar.khalil@thinkers.demo'],
            ['Maya Nasser', 'maya.nasser@thinkers.demo'], ['Adam Saleh', 'adam.saleh@thinkers.demo'],
            ['Sara Mansour', 'sara.mansour@thinkers.demo'], ['Daniel Reed', 'daniel.reed@thinkers.demo'],
        ];

        return collect($people)->map(function (array $person) use ($admin): User {
            $user = User::updateOrCreate(['email' => $person[1]], [
                'name' => $person[0], 'password' => self::PASSWORD, 'email_verified_at' => now(),
                'instructor_status' => 'approved', 'instructor_approved_at' => now(), 'instructor_approved_by' => $admin->id,
                'instructor_rejection_reason' => null,
            ]);
            $user->assignRole('instructor');

            return $user;
        });
    }

    private function seedCategories()
    {
        $items = [
            'Programming' => 'Build strong software engineering and problem-solving foundations.',
            'Web Development' => 'Create accessible, secure, and high-performing web applications.',
            'Mobile Development' => 'Design and build polished applications for modern mobile devices.',
            'Artificial Intelligence' => 'Understand and apply practical machine learning and generative AI.',
            'Data Science' => 'Turn raw data into trustworthy analysis and business insight.',
            'Cybersecurity' => 'Protect systems, applications, identities, and information.',
            'UI/UX Design' => 'Research, design, test, and refine useful digital experiences.',
            'Business' => 'Develop leadership, strategy, finance, and operational capabilities.',
            'Marketing' => 'Plan measurable campaigns and build valuable customer relationships.',
            'Languages' => 'Communicate confidently in academic and professional settings.',
        ];

        return collect($items)->mapWithKeys(function (string $description, string $name): array {
            $slug = Str::slug(str_replace('/', ' ', $name));

            return [$slug => Category::updateOrCreate(['slug' => $slug], ['name' => $name, 'description' => $description, 'is_active' => true, 'sort_order' => 10])];
        });
    }

    private function seedCourses(User $admin, $instructors, $categories)
    {
        $courses = [
            ['programming', 'Python Programming: Zero to Projects', 'beginner', 420, 0, 'Master Python syntax, functions, data structures, testing, and practical automation.', 'photo-1526379095098-d400fd0bf935'],
            ['programming', 'Clean Code and Software Design', 'intermediate', 360, 39, 'Write maintainable code using refactoring, design principles, and effective tests.', 'photo-1515879218367-8466d910aaa4'],
            ['web-development', 'Modern HTML, CSS and JavaScript', 'beginner', 540, 0, 'Build responsive, accessible websites with the modern browser platform.', 'photo-1498050108023-c5249f4df085'],
            ['web-development', 'Laravel 12 API Engineering', 'advanced', 480, 59, 'Design secure Laravel APIs with Sanctum, policies, queues, testing, and observability.', 'photo-1555066931-4365d14bab8c'],
            ['web-development', 'React and Vite in Production', 'intermediate', 450, 49, 'Create fast React applications with reusable components, routing, and robust data flows.', 'photo-1633356122544-f134324a6cee'],
            ['mobile-development', 'Flutter App Development', 'beginner', 460, 45, 'Build cross-platform mobile interfaces, state management, and API integrations.', 'photo-1512941937669-90a1b58e7e9c'],
            ['mobile-development', 'React Native: Build and Ship', 'intermediate', 390, 49, 'Develop, test, optimize, and publish professional React Native applications.', 'photo-1551650975-87deedd944c3'],
            ['artificial-intelligence', 'Generative AI Foundations', 'beginner', 300, 0, 'Understand language models, prompting, responsible AI, and useful product patterns.', 'photo-1677442136019-21780ecad995'],
            ['artificial-intelligence', 'Applied Machine Learning with Python', 'intermediate', 520, 69, 'Prepare data, train models, evaluate results, and deliver reliable ML solutions.', 'photo-1555949963-ff9fe0c870eb'],
            ['data-science', 'Data Analysis with Python and Pandas', 'beginner', 400, 35, 'Clean, explore, visualize, and communicate real-world datasets with confidence.', 'photo-1551288049-bebda4e38f71'],
            ['data-science', 'SQL for Analytics', 'intermediate', 330, 29, 'Write efficient analytical queries using joins, windows, CTEs, and data modeling.', 'photo-1544383835-bda2bc66a55d'],
            ['cybersecurity', 'Cybersecurity Essentials', 'beginner', 360, 0, 'Learn threat modeling, network defense, identity security, and incident response.', 'photo-1563013544-824ae1b704d3'],
            ['cybersecurity', 'Web Application Security', 'advanced', 420, 65, 'Find and prevent modern web vulnerabilities through secure engineering practices.', 'photo-1614064641938-3bbee52942c7'],
            ['ui-ux-design', 'UI/UX Design Foundations', 'beginner', 350, 39, 'Turn user research into accessible interfaces, prototypes, and tested experiences.', 'photo-1561070791-2526d30994b5'],
            ['business', 'Product Management Fundamentals', 'beginner', 280, 35, 'Discover customer needs, prioritize outcomes, and lead product delivery.', 'photo-1552664730-d307ca884978'],
            ['business', 'Agile Project Leadership', 'intermediate', 300, 45, 'Plan work, manage risk, facilitate teams, and deliver value iteratively.', 'photo-1521737711867-e3b97375f902'],
            ['marketing', 'Digital Marketing Strategy', 'beginner', 320, 29, 'Create measurable content, search, email, and social media campaigns.', 'photo-1533750349088-cd871a92f312'],
            ['languages', 'Professional English Communication', 'intermediate', 300, 0, 'Communicate clearly in meetings, presentations, email, and interviews.', 'photo-1457369804613-52c61a468e7d'],
        ];

        return collect($courses)->values()->map(function (array $item, int $index) use ($admin, $instructors, $categories): Course {
            [$categorySlug, $title, $level, $duration, $price, $summary, $photo] = $item;
            $course = Course::updateOrCreate(['slug' => Str::slug($title)], [
                'instructor_id' => $instructors[$index % $instructors->count()]->id, 'category_id' => $categories[$categorySlug]->id,
                'title' => $title, 'short_description' => $summary, 'description' => $this->courseDescription($title, $summary),
                'thumbnail' => "https://images.unsplash.com/{$photo}?auto=format&fit=crop&w=1200&q=80", 'level' => $level,
                'language' => 'English', 'duration' => $duration, 'price' => $price, 'currency' => 'USD', 'type' => $price > 0 ? 'paid' : 'free',
                'status' => 'published', 'reviewed_by' => $admin->id, 'reviewed_at' => now(), 'published_at' => now(), 'rejection_reason' => null,
            ]);
            $this->seedCurriculum($course);

            return $course;
        });
    }

    private function courseDescription(string $title, string $summary): string
    {
        return "<h2>About {$title}</h2><p>{$summary}</p><h3>What you will learn</h3><ul><li>Apply the essential concepts through guided practice.</li><li>Complete realistic exercises and make informed technical decisions.</li><li>Build a repeatable workflow you can use in professional projects.</li><li>Evaluate your understanding through lesson quizzes.</li></ul><h3>Requirements</h3><ul><li>A computer with a modern browser and internet access.</li><li>No specialist experience is required unless the course is marked advanced.</li><li>Curiosity and time to complete the practical exercises.</li></ul>";
    }

    private function seedCurriculum(Course $course): void
    {
        $topic = $course->title;
        $sections = [
            ['Foundations', ['Welcome and Learning Roadmap', 'Essential Concepts', 'Knowledge Check']],
            ['Core Skills', ['Working with the Core Workflow', 'Guided Real-World Example', 'Core Skills Challenge']],
            ['Applied Practice', ['Planning a Practical Project', 'Building the Solution', 'Application Review']],
            ['Professional Next Steps', ['Quality and Best Practices', 'Common Mistakes and Improvements', 'Final Assessment and Roadmap']],
        ];
        foreach ($sections as $sectionIndex => [$sectionTitle, $lessons]) {
            $section = CourseSection::updateOrCreate(['course_id' => $course->id, 'position' => $sectionIndex + 1], ['title' => $sectionTitle, 'description' => "Develop {$sectionTitle} skills for {$topic}."]);
            foreach ($lessons as $lessonIndex => $lessonTitle) {
                $lesson = Lesson::updateOrCreate(['course_section_id' => $section->id, 'position' => $lessonIndex + 1], [
                    'title' => $lessonTitle, 'slug' => Str::slug($lessonTitle), 'description' => "A focused {$topic} lesson covering {$lessonTitle}.",
                    'text_content' => $this->lessonContent($topic, $lessonTitle, $lessonIndex === 1), 'content_type' => 'text',
                    'duration' => 15 + (($sectionIndex + $lessonIndex) % 4) * 5, 'is_preview' => $sectionIndex === 0 && $lessonIndex === 0,
                    'is_published' => true, 'content_updated_at' => now(),
                ]);
                if ($lessonIndex === 2) {
                    $this->seedQuiz($lesson, $topic);
                }
            }
        }
    }

    private function lessonContent(string $topic, string $title, bool $withVideo): string
    {
        $video = $withVideo ? '<h3>Video walkthrough</h3><p><a href="https://www.youtube.com/watch?v=ysz5S6PUM-U" target="_blank" rel="noopener">Watch the accompanying sample lesson on YouTube</a>.</p>' : '';

        return "<h2>{$title}</h2><p>In this lesson, you will connect the principles of {$topic} to a realistic professional scenario. Start by identifying the goal, the available information, and the quality criteria for a successful result.</p><h3>Key ideas</h3><ul><li>Break complex work into observable, testable steps.</li><li>Use feedback early instead of waiting until the end.</li><li>Document important decisions and assumptions.</li></ul>{$video}<h3>Practice</h3><p>Create a short example of your own, explain why it works, and identify one improvement you would make after receiving feedback.</p>";
    }

    private function seedQuiz(Lesson $lesson, string $topic): void
    {
        $quiz = Quiz::updateOrCreate(['lesson_id' => $lesson->id], ['title' => "{$lesson->title} Quiz", 'description' => "Check your understanding of {$topic}.", 'passing_score_percentage' => 70, 'maximum_attempts' => 3, 'time_limit_minutes' => 10, 'status' => 'published']);
        $questions = [
            ['What is the most effective first step when applying a new concept?', ['Define the goal and success criteria', 'Skip planning and begin immediately', 'Copy a solution without reviewing it', 'Avoid asking for feedback']],
            ['Which practice best improves the quality of professional work?', ['Iterate using evidence and feedback', 'Keep assumptions undocumented', 'Test only after release', 'Optimize before understanding the problem']],
            ["How should a learner strengthen their {$topic} skills?", ['Combine explanation with deliberate practice', 'Memorize terms without applying them', 'Avoid realistic examples', 'Ignore mistakes']],
        ];
        foreach ($questions as $index => [$text, $options]) {
            $question = Question::updateOrCreate(['quiz_id' => $quiz->id, 'position' => $index + 1], ['question_text' => $text, 'question_type' => 'multiple_choice', 'points' => 1]);
            foreach ($options as $optionIndex => $option) {
                Answer::updateOrCreate(['question_id' => $question->id, 'position' => $optionIndex + 1], ['option_text' => $option, 'is_correct' => $optionIndex === 0]);
            }
        }
    }

    private function seedStudents()
    {
        $names = ['Noor Ahmad', 'Yousef Ali', 'Rana Ibrahim', 'Kareem Taha', 'Leen Samir', 'Zaid Hasan', 'Emily Carter', 'Alex Morgan'];

        return collect($names)->map(function (string $name, int $index): User {
            $user = User::updateOrCreate(['email' => 'student'.($index + 1).'@thinkers.demo'], ['name' => $name, 'password' => self::PASSWORD, 'email_verified_at' => now()]);
            $user->assignRole('student');

            return $user;
        });
    }

    private function seedLearningActivity($students, $courses): void
    {
        foreach ($students as $studentIndex => $student) {
            foreach (range(0, 3) as $offset) {
                $course = $courses[($studentIndex * 2 + $offset) % $courses->count()];
                $lessons = $course->sections()->with('lessons.quiz.questions.answers')->get()->flatMap->lessons->values();
                $completedCount = 3 + (($studentIndex + $offset) % 8);
                $enrollment = Enrollment::updateOrCreate(['user_id' => $student->id, 'course_id' => $course->id], ['last_accessed_lesson_id' => $lessons[min($completedCount, $lessons->count() - 1)]->id, 'status' => 'active', 'enrolled_at' => now()->subDays(20 + $studentIndex * 2)]);
                foreach ($lessons->take($completedCount) as $lesson) {
                    Progress::updateOrCreate(['enrollment_id' => $enrollment->id, 'lesson_id' => $lesson->id], ['status' => 'completed', 'completion_percentage' => 100, 'playback_position' => $lesson->duration * 60, 'started_at' => now()->subDays(14), 'last_accessed_at' => now()->subDays(2), 'completed_at' => now()->subDays(2)]);
                }
                $quiz = $lessons->pluck('quiz')->filter()->first();
                if ($quiz) {
                    $this->seedAttempt($student, $enrollment, $quiz);
                }
                Review::updateOrCreate(['user_id' => $student->id, 'course_id' => $course->id], ['rating' => 4 + (($studentIndex + $offset) % 2), 'review_text' => 'Clear explanations, practical examples, and a well-organized learning path. The exercises helped me apply each concept with confidence.', 'status' => 'published']);
            }
            $this->seedConversation($student, $courses[($studentIndex * 2) % $courses->count()]);
        }
    }

    private function seedAttempt(User $student, Enrollment $enrollment, Quiz $quiz): void
    {
        $questions = $quiz->questions;
        $attempt = QuizAttempt::updateOrCreate(['quiz_id' => $quiz->id, 'user_id' => $student->id, 'attempt_number' => 1], ['enrollment_id' => $enrollment->id, 'status' => 'submitted', 'score' => $questions->count(), 'maximum_score' => $questions->count(), 'percentage' => 100, 'passed' => true, 'started_at' => now()->subDays(3), 'completed_at' => now()->subDays(3)]);
        foreach ($questions as $question) {
            $answer = $question->answers->firstWhere('is_correct', true);
            QuizAttemptAnswer::updateOrCreate(['quiz_attempt_id' => $attempt->id, 'question_id' => $question->id], ['answer_id' => $answer->id, 'is_correct' => true, 'awarded_points' => $question->points]);
        }
    }

    private function seedConversation(User $student, Course $course): void
    {
        $lesson = $course->sections()->with('lessons')->first()?->lessons->first();
        $conversation = AIConversation::updateOrCreate(['user_id' => $student->id, 'course_id' => $course->id, 'lesson_id' => $lesson?->id], ['title' => "Understanding {$course->title}"]);
        $messages = [
            ['user', "Can you explain the main idea from {$lesson?->title} in simple terms?", 18],
            ['assistant', "The central idea is to turn a large {$course->title} problem into smaller steps: define the goal, apply one concept at a time, check the result, and improve it using feedback.", 52],
            ['user', 'Can you give me a practical example?', 10],
            ['assistant', 'Start with a small scenario from the lesson. Write down the desired outcome, create a first solution, test it against two clear criteria, then document one improvement for the next version.', 45],
        ];
        foreach ($messages as $index => [$role, $content, $tokens]) {
            AIMessage::updateOrCreate(['conversation_id' => $conversation->id, 'role' => $role, 'content' => $content], ['tokens_used' => $tokens, 'created_at' => now()->subMinutes(20 - $index * 4)]);
        }
    }
}
