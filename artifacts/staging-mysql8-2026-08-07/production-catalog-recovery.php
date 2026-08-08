<?php
declare(strict_types=1);

/*
 * THINKERS production catalog recovery runner.
 * Invoked only by production-catalog-recovery.ps1. Dry-run is the default.
 * It never imports users, roles, permissions, sessions, cache, jobs, or migrations.
 */

$execute = in_array('--execute', $argv, true);
$runId = getenv('THINKERS_RUN_ID') ?: gmdate('Ymd-His');
$reportFile = getenv('THINKERS_REPORT_FILE') ?: __DIR__."/production-recovery-$runId.json";
$sourceMediaRoot = rtrim((string)getenv('THINKERS_SOURCE_MEDIA_ROOT'), "\\/");
$courseMediaRoot = rtrim((string)getenv('THINKERS_PROD_COURSE_MEDIA_ROOT'), "\\/");
$publicMediaRoot = rtrim((string)getenv('THINKERS_PROD_PUBLIC_MEDIA_ROOT'), "\\/");
$publicMediaUrl = rtrim((string)getenv('THINKERS_PUBLIC_MEDIA_URL_PREFIX'), '/');

function envRequired(string $key): string { $value = getenv($key); if ($value === false || $value === '') throw new RuntimeException("Missing required environment variable: $key"); return $value; }
function pdo(string $prefix): PDO {
    $host = envRequired("{$prefix}_HOST"); $port = envRequired("{$prefix}_PORT"); $database = envRequired("{$prefix}_DATABASE");
    $user = envRequired("{$prefix}_USER"); $password = (string)(getenv("{$prefix}_PASSWORD") ?: '');
    return new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
}
function scalar(PDO $db, string $sql, array $params = []): mixed { $s=$db->prepare($sql); $s->execute($params); return $s->fetchColumn(); }
function rows(PDO $db, string $sql, array $params = []): array { $s=$db->prepare($sql); $s->execute($params); return $s->fetchAll(); }
function insert(PDO $db, string $table, array $values): int {
    $columns = array_keys($values); $quoted = array_map(fn($c) => "`$c`", $columns); $holders = array_map(fn($c) => ":$c", $columns);
    $sql = "INSERT INTO `$table` (".implode(',', $quoted).") VALUES (".implode(',', $holders).")";
    $s = $db->prepare($sql); $s->execute($values); return (int)$db->lastInsertId();
}
function without(array $row, array $columns): array { foreach ($columns as $column) unset($row[$column]); return $row; }
function hashFileChecked(string $path, string $expected): void { if (!is_file($path)) throw new RuntimeException("Required media source is missing: $path"); if (!hash_equals(strtolower($expected), hash_file('sha256', $path))) throw new RuntimeException("Media checksum mismatch: $path"); }
function copyMedia(string $source, string $destination, string $checksum): void {
    hashFileChecked($source, $checksum); if (file_exists($destination)) throw new RuntimeException("Refusing to overwrite production media: $destination");
    if (!is_dir(dirname($destination)) && !mkdir(dirname($destination), 0770, true) && !is_dir(dirname($destination))) throw new RuntimeException("Cannot create destination directory: ".dirname($destination));
    if (!copy($source, $destination)) throw new RuntimeException("Media copy failed: $destination");
    if (!hash_equals(strtolower($checksum), hash_file('sha256', $destination))) throw new RuntimeException("Destination media checksum mismatch: $destination");
}

$report = ['run_id'=>$runId, 'mode'=>$execute ? 'execute' : 'dry-run', 'started_at'=>gmdate('c'), 'inserted'=>[], 'maps'=>[], 'checks'=>[], 'status'=>'failed'];
try {
    $source = pdo('THINKERS_SOURCE_DB'); $target = pdo('THINKERS_PROD_DB');
    $adminEmail = 'marakshilaila@gmail.com';
    $admins = rows($target, "SELECT u.id,u.email FROM users u JOIN model_has_roles m ON m.model_id=u.id AND m.model_type='App\\\\Models\\\\User' JOIN roles r ON r.id=m.role_id WHERE LOWER(u.email)=LOWER(?) AND r.name='admin' FOR UPDATE", [$adminEmail]);
    if (count($admins) !== 1) throw new RuntimeException('Production admin safety check failed: expected exactly one existing admin.');
    $adminId = (int)$admins[0]['id']; $report['checks']['admin_id']=$adminId;
    $migrationCount = (int)scalar($target, 'SELECT COUNT(*) FROM migrations'); $sourceMigrations=(int)scalar($source, 'SELECT COUNT(*) FROM migrations');
    if ($migrationCount !== $sourceMigrations) throw new RuntimeException("Migration safety check failed: production=$migrationCount source=$sourceMigrations.");
    $report['checks']['migrations']=$migrationCount;
    $published = rows($source, "SELECT * FROM courses WHERE status='published' ORDER BY id");
    $categories = rows($source, 'SELECT * FROM categories ORDER BY id');
    $preflight = ['categories'=>count($categories),'courses'=>count($published),'sections'=>(int)scalar($source,"SELECT COUNT(*) FROM course_sections s JOIN courses c ON c.id=s.course_id WHERE c.status='published'"),'lessons'=>(int)scalar($source,"SELECT COUNT(*) FROM lessons l JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published'"),'quizzes'=>(int)scalar($source,"SELECT COUNT(*) FROM quizzes q JOIN lessons l ON l.id=q.lesson_id JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published'"),'videos'=>(int)scalar($source,"SELECT COUNT(*) FROM videos v JOIN lessons l ON l.id=v.lesson_id JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published'"),'attachments'=>(int)scalar($source,"SELECT COUNT(*) FROM attachments a JOIN lessons l ON l.id=a.lesson_id JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published'")];
    $report['preflight']=$preflight;
    $conflicts=[];
    foreach ($categories as $row) if (scalar($target,'SELECT id FROM categories WHERE slug=?',[$row['slug']]) !== false) $conflicts[]="category slug {$row['slug']}";
    foreach ($published as $row) if (scalar($target,'SELECT id FROM courses WHERE slug=?',[$row['slug']]) !== false) $conflicts[]="course slug {$row['slug']}";
    if ($conflicts) throw new RuntimeException('Conflict gate failed; nothing was changed: '.implode(', ', $conflicts));
    if (!$execute) { $report['status']='dry-run-passed'; $report['checks']['conflicts']=0; throw new LogicException('DRY_RUN_COMPLETE'); }

    $backupPath=envRequired('THINKERS_FINAL_BACKUP_PATH'); $backupHash=envRequired('THINKERS_FINAL_BACKUP_SHA256');
    if (!is_file($backupPath) || !hash_equals(strtolower($backupHash), hash_file('sha256',$backupPath))) throw new RuntimeException('Final production backup check failed.');
    if ($sourceMediaRoot==='' || $courseMediaRoot==='' || $publicMediaRoot==='' || $publicMediaUrl==='') throw new RuntimeException('Execution requires persistent course-media/public media roots and a public media URL prefix.');

    $target->beginTransaction();
    $lockedAdmin=rows($target, "SELECT u.id FROM users u JOIN model_has_roles m ON m.model_id=u.id AND m.model_type='App\\\\Models\\\\User' JOIN roles r ON r.id=m.role_id WHERE u.id=? AND LOWER(u.email)=LOWER(?) AND r.name='admin' FOR UPDATE", [$adminId,$adminEmail]);
    if (count($lockedAdmin)!==1) throw new RuntimeException('Administrator changed after preflight; transaction aborted.');
    $mapCategory=[]; $mapCourse=[]; $mapSection=[]; $mapLesson=[]; $mapQuiz=[]; $mapQuestion=[];
    foreach ($categories as $row) { $sourceId=(int)$row['id']; $parent=$row['parent_id']; $row=without($row,['id','parent_id']); $row['parent_id']=null; $mapCategory[$sourceId]=insert($target,'categories',$row); }
    foreach ($categories as $row) if ($row['parent_id'] !== null) { $target->prepare('UPDATE categories SET parent_id=? WHERE id=?')->execute([$mapCategory[(int)$row['parent_id']],$mapCategory[(int)$row['id']]]); }
    $report['inserted']['categories']=count($mapCategory); $report['maps']['categories']=$mapCategory;

    foreach ($published as $row) { $sourceId=(int)$row['id']; $sourceThumbnail=$row['thumbnail']; $row=without($row,['id']); $row['instructor_id']=$adminId; $row['category_id']=$mapCategory[(int)$row['category_id']]; $row['reviewed_by']=$row['reviewed_by']===null?null:$adminId; $row['thumbnail']=null; $targetId=insert($target,'courses',$row); $mapCourse[$sourceId]=$targetId; if (is_string($sourceThumbnail) && str_contains($sourceThumbnail,'localhost') && str_contains($sourceThumbnail,'/storage/courses/')) { $name=basename((string)parse_url($sourceThumbnail,PHP_URL_PATH)); $target->prepare('UPDATE courses SET thumbnail=? WHERE id=?')->execute([$publicMediaUrl.'/courses/'.$targetId.'/'.$name,$targetId]); } elseif ($sourceThumbnail!==null) { $target->prepare('UPDATE courses SET thumbnail=? WHERE id=?')->execute([$sourceThumbnail,$targetId]); } }
    $report['inserted']['courses']=count($mapCourse); $report['maps']['courses']=$mapCourse;

    $sections=rows($source,"SELECT s.* FROM course_sections s JOIN courses c ON c.id=s.course_id WHERE c.status='published' ORDER BY s.id");
    foreach ($sections as $row) { $sourceId=(int)$row['id']; $row=without($row,['id']); $row['course_id']=$mapCourse[(int)$row['course_id']]; $mapSection[$sourceId]=insert($target,'course_sections',$row); }
    $report['inserted']['course_sections']=count($mapSection); $report['maps']['course_sections']=$mapSection;
    $lessons=rows($source,"SELECT l.*,s.course_id AS source_course_id FROM lessons l JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published' ORDER BY l.id");
    $sourceLessonCourse=[]; foreach ($lessons as $row) { $sourceId=(int)$row['id']; $sourceLessonCourse[$sourceId]=(int)$row['source_course_id']; $row=without($row,['id','source_course_id']); $row['course_section_id']=$mapSection[(int)$row['course_section_id']]; $mapLesson[$sourceId]=insert($target,'lessons',$row); }
    $report['inserted']['lessons']=count($mapLesson); $report['maps']['lessons']=$mapLesson;
    $quizzes=rows($source,"SELECT q.* FROM quizzes q JOIN lessons l ON l.id=q.lesson_id JOIN course_sections s ON s.id=l.course_section_id JOIN courses c ON c.id=s.course_id WHERE c.status='published' ORDER BY q.id");
    foreach ($quizzes as $row) { $sourceId=(int)$row['id']; $row=without($row,['id']); $row['lesson_id']=$mapLesson[(int)$row['lesson_id']]; $mapQuiz[$sourceId]=insert($target,'quizzes',$row); }
    $report['inserted']['quizzes']=count($mapQuiz); $report['maps']['quizzes']=$mapQuiz;
    $questions=rows($source,'SELECT q.* FROM questions q JOIN quizzes z ON z.id=q.quiz_id ORDER BY q.id');
    foreach ($questions as $row) { if (!isset($mapQuiz[(int)$row['quiz_id']])) continue; $sourceId=(int)$row['id']; $row=without($row,['id']); $row['quiz_id']=$mapQuiz[(int)$row['quiz_id']]; $mapQuestion[$sourceId]=insert($target,'questions',$row); }
    $report['inserted']['questions']=count($mapQuestion); $report['maps']['questions']=$mapQuestion;
    $answers=rows($source,'SELECT * FROM answers ORDER BY id'); $answerCount=0;
    foreach ($answers as $row) { if (!isset($mapQuestion[(int)$row['question_id']])) continue; $row=without($row,['id']); $row['question_id']=$mapQuestion[(int)$row['question_id']]; insert($target,'answers',$row); $answerCount++; }
    $report['inserted']['answers']=$answerCount;

    $mediaRows=[];
    $videoCount=0; foreach (rows($source,'SELECT * FROM videos ORDER BY id') as $row) { if (!isset($mapLesson[(int)$row['lesson_id']])) continue; $sourceId=(int)$row['id']; $courseId=$mapCourse[$sourceLessonCourse[(int)$row['lesson_id']]]; $targetLesson=$mapLesson[(int)$row['lesson_id']]; $relative='courses/'.$courseId.'/lessons/'.$targetLesson.'/videos/'.basename($row['path']); copyMedia($sourceMediaRoot.'/private/course-media/'.$row['path'],$courseMediaRoot.'/'.$relative,(string)$row['checksum']); $row=without($row,['id']); $row['lesson_id']=$targetLesson; $row['path']=$relative; $targetId=insert($target,'videos',$row); $report['maps']['videos'][$sourceId]=$targetId; $videoCount++; $mediaRows[]=['kind'=>'video','path'=>$relative]; }
    $attachmentCount=0; foreach (rows($source,'SELECT * FROM attachments ORDER BY id') as $row) { if (!isset($mapLesson[(int)$row['lesson_id'])) continue; $sourceId=(int)$row['id']; $courseId=$mapCourse[$sourceLessonCourse[(int)$row['lesson_id']]]; $targetLesson=$mapLesson[(int)$row['lesson_id']]; $relative='courses/'.$courseId.'/lessons/'.$targetLesson.'/attachments/'.basename($row['path']); copyMedia($sourceMediaRoot.'/private/course-media/'.$row['path'],$courseMediaRoot.'/'.$relative,(string)$row['checksum']); $row=without($row,['id']); $row['lesson_id']=$targetLesson; $row['path']=$relative; $targetId=insert($target,'attachments',$row); $report['maps']['attachments'][$sourceId]=$targetId; $attachmentCount++; $mediaRows[]=['kind'=>'attachment','path'=>$relative]; }
    foreach ($published as $row) if (is_string($row['thumbnail']) && str_contains($row['thumbnail'],'localhost') && str_contains($row['thumbnail'],'/storage/courses/')) { $courseId=$mapCourse[(int)$row['id']]; $name=basename((string)parse_url($row['thumbnail'],PHP_URL_PATH)); $sourcePath=$sourceMediaRoot.'/public/courses/'.(int)$row['id'].'/'.$name; $dest=$publicMediaRoot.'/courses/'.$courseId.'/'.$name; $expected=hash_file('sha256',$sourcePath); copyMedia($sourcePath,$dest,$expected); $mediaRows[]=['kind'=>'thumbnail','path'=>'courses/'.$courseId.'/'.$name]; }
    $report['inserted']['videos']=$videoCount; $report['inserted']['attachments']=$attachmentCount; $report['media']=$mediaRows;

    $orphanSql="SELECT (SELECT COUNT(*) FROM courses c LEFT JOIN categories k ON k.id=c.category_id LEFT JOIN users u ON u.id=c.instructor_id WHERE k.id IS NULL OR u.id IS NULL)+(SELECT COUNT(*) FROM course_sections s LEFT JOIN courses c ON c.id=s.course_id WHERE c.id IS NULL)+(SELECT COUNT(*) FROM lessons l LEFT JOIN course_sections s ON s.id=l.course_section_id WHERE s.id IS NULL)+(SELECT COUNT(*) FROM quizzes q LEFT JOIN lessons l ON l.id=q.lesson_id WHERE l.id IS NULL)+(SELECT COUNT(*) FROM questions q LEFT JOIN quizzes z ON z.id=q.quiz_id WHERE z.id IS NULL)+(SELECT COUNT(*) FROM answers a LEFT JOIN questions q ON q.id=a.question_id WHERE q.id IS NULL)+(SELECT COUNT(*) FROM videos v LEFT JOIN lessons l ON l.id=v.lesson_id WHERE l.id IS NULL)+(SELECT COUNT(*) FROM attachments a LEFT JOIN lessons l ON l.id=a.lesson_id WHERE l.id IS NULL)";
    $orphans=(int)scalar($target,$orphanSql); if ($orphans!==0) throw new RuntimeException("Foreign-key validation failed: $orphans orphaned rows.");
    $target->commit(); $report['checks']['foreign_key_orphans']=0; $report['status']='execute-passed';
} catch (LogicException $e) { if ($e->getMessage()!=='DRY_RUN_COMPLETE') throw $e; }
catch (Throwable $e) { if (isset($target) && $target->inTransaction()) $target->rollBack(); $report['error']=$e->getMessage(); }
finally { $report['finished_at']=gmdate('c'); file_put_contents($reportFile,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)); }
if (($report['status'] ?? '')==='failed') { fwrite(STDERR,($report['error'] ?? 'Unknown failure')."\n"); exit(1); }
echo "Report: $reportFile\nStatus: {$report['status']}\n";
