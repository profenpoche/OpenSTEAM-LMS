<?php
if(!empty($_COOKIE["isFromGar"]) && empty($_SESSION['phpCAS']['user'])){
    setcookie("isFromGar","",time()-1);
    setcookie("isGarTest","",time()-1);
    return header("Location:/classroom/gar_user_disconnect.php");
}

require_once(__DIR__ . "/../vendor/autoload.php");

use Dotenv\Dotenv;
use DAO\RegularDAO;
use models\Regular;
use DAO\SettingsDAO;
use Utils\ConnectionManager;
use Database\DatabaseManager;

// load data from .env file
$dotenv = Dotenv::createImmutable(__DIR__."/../");
$dotenv->safeLoad();
ini_set('session.cookie_path', '/');
if (isset($_ENV['COOKIE_DOMAIN'])){
    ini_set('session.cookie_secure', "1");
    ini_set('session.cookie_samesite', 'None');
    ini_set('session.cookie_domain', $_ENV['COOKIE_DOMAIN']);
}
$lang = !empty($_ENV['VS_LANG']) ? $_ENV['VS_LANG'] : 'en';
$allowed_lang = array('fr', 'en');
if (!empty($_REQUEST['lang']) && in_array($_REQUEST['lang'], $allowed_lang)){
    $lang = $_REQUEST['lang'];
}
setcookie('lng', $lang);
session_start();

if(isset($_SESSION['id']) && strpos($_SESSION["id"], 'classroom_') === 0){
	$_SESSION['id'] = null;
        $_SESSION['token'] = null;

}
// load demoStudent name from .env file or set it to default demoStudent
$demoStudent = !empty($_ENV['VS_DEMOSTUDENT']) ? $_ENV['VS_DEMOSTUDENT'] : 'demostudent';

$user = ConnectionManager::getSharedInstance()->checkConnected();

if ($user) {
    header("Location: /classroom/home.php");
    die();
}

require_once(__DIR__ . "/header.html");
?>
<link rel="stylesheet" href="/classroom/assets/css/main.css">

<script src="./assets/js/lib/rotate.js"></script>
<link rel="stylesheet" type="text/css" href="/classroom/assets/js/lib/slick-1.8.1/slick/slick.css" />
</head>

<body>
<?php

    
    //echo '<pre>';print_r($_SESSION);echo '</pre>';
    // add script tag with demoStudent name to make it available on the whole site
    $demoStudent = str_replace('"', '', $demoStudent);
    echo "<script>const demoStudentName = `{$demoStudent}`</script>";
    require_once(__DIR__ . "/login.html");
    ?>

    <?php
    require_once(__DIR__ . "/footer.html");
    ?>
