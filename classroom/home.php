<?php

$allowed_lang = array('fr', 'en');
if (!empty($_REQUEST['lang']) && in_array($_REQUEST['lang'], $allowed_lang)){
    $lang = $_REQUEST['lang'];
    setcookie('lng', $lang);
}
$openClassroomDir = __DIR__."/../../openClassroom";
if(is_dir($openClassroomDir)){
    require __DIR__."/../../vendor/autoload.php";
    require __DIR__."/../../bootstrap.php";
} else {
    require __DIR__."/../vendor/autoload.php";
    require __DIR__."/../bootstrap.php";
}
use Dotenv\Dotenv;
// load data from .env file
$dotenv = Dotenv::createImmutable(__DIR__."/../");
$dotenv->safeLoad();
if (isset($_ENV['COOKIE_DOMAIN'])){
    ini_set('session.cookie_secure', "1");
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_domain', $_ENV['COOKIE_DOMAIN']);
}
session_start();
// load demoStudent name from .env file or set it to default demoStudent
$demoStudent = !empty($_ENV['VS_DEMOSTUDENT']) ? $_ENV['VS_DEMOSTUDENT'] : 'demostudent';

if (isset($_SESSION['idProf'])) {
    $user = $entityManager->getRepository('User\Entity\User')
        ->find($_SESSION['idProf']);
} else if (isset($_SESSION['id'])) {
    $user = $entityManager->getRepository('User\Entity\User')
        ->find($_SESSION['id']);
}
if (empty($user)) {
   header("Location: /classroom/login.php");
}

require_once(__DIR__ . "/header.html");

// add script tag with demoStudent name to make it available on the whole site
$demoStudent = str_replace('"', '', $demoStudent);
echo "<script>const demoStudentName = `{$demoStudent}`</script>";

// echo '<pre>';print_r($_COOKIE);echo '</pre>';
$html = file_get_contents(__DIR__ . "/home.html");
if(isset($_COOKIE['lng']) && $_COOKIE['lng'] === 'fr'){
    $html = str_replace('/app-lms/', '/app-lms2/', $html);
}
echo $html;