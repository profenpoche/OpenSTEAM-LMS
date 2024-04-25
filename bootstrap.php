<?php

use Doctrine\ORM\Tools\Setup;
use Doctrine\ORM\EntityManager;
use Doctrine\DBAL\DriverManager;
use Dotenv\Dotenv;

require_once "vendor/autoload.php";

// Create a simple "default" Doctrine ORM configuration for Annotations
$isDevMode = true;
$proxyDir = null;
$cache = null;
$useSimpleAnnotationReader = false;
// Array of all namespaces containing entities with annotations.
$config = Setup::createAnnotationMetadataConfiguration(
    array(
        __DIR__ . "/vendor/vittascience/vtuser/src/Entity",
        __DIR__ . "/vendor/vittascience/vtclassroom/src/Entity",
        __DIR__ . "/vendor/vittascience/vtinterfaces/src/Entity",
        __DIR__ . "/vendor/vittascience/vtlearn/Entity",
    ),
    $isDevMode,
    $proxyDir,
    $cache,
    $useSimpleAnnotationReader
);

// Load env variables 
/* $dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load(); */

$dataLines = file(__DIR__.'/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

foreach($dataLines as $line){
    if(strpos(trim($line),'#') === 0) continue;
    list($key,$value) = explode('=',$line,2);
    $_ENV[trim($key)] = trim($value);
}

if (file_exists(__DIR__.'/conf.ini')){
   $conf = parse_ini_file('conf.ini');
   if ($conf){
       $_ENV = array_merge($_ENV,$conf);
   }
}
// can't use custom dot.env is use elsewhere to read .env

/*$dataLines = file(__DIR__.'/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$re = '/(?\'key\'[^\[\]]*)(?\'array\'\[*)(?\'rkey\'[^\[\]]*)]*.*=(?\'value\'.*)/m';

foreach($dataLines as $line){
    if(strpos(trim($line),'#') === 0) continue;
    $matches = [];
    preg_match_all($re, $line, $matches, PREG_SET_ORDER, 0);
    if ($matches[0]['array']){
        if (!is_array($_ENV[$matches[0]['key']])){
            $_ENV[trim($matches[0]['key'])]= array();           
        }
        if ($matches[0]['rkey']){
            $_ENV[trim($matches[0]['key'])][trim($matches[0]['rkey'])] =trim($matches[0]['value']);
        }else {
            $_ENV[trim($matches[0]['key'])][] =trim($matches[0]['value']);
        }
    } else {
        $_ENV[trim($matches[0]['key'])] = trim($matches[0]['value']);
    }
}*/

// Database configuration parameters
$connectionParams = array(
    'dbname' =>  $_ENV['VS_DB_NAME'],
    'user' => $_ENV['VS_DB_USER'],
    'port' => $_ENV['VS_DB_PORT'],
    'password' => $_ENV['VS_DB_PWD'],
    'host' => $_ENV['VS_DB_HOST'],
    'driver' => 'pdo_mysql',
    'charset' => 'utf8',
);

$conn = DriverManager::getConnection($connectionParams);
// obtaining the entity manager
$entityManager = EntityManager::create($conn, $config);
