<?php
$API_KEY = 'cssproxy';

$postText = 'data=' . $_GET['data'];
$language = $_GET['lang'];

if (strcmp($API_KEY, '') != 0)
{
   $postText .= '&key=' . $API_KEY;
}

$url = '/checkDocument';

/* this function directly from akismet.php by Matt Mullenweg.  *props* */
function AtD_http_post($request, $host, $path, $port = 80) 
{
   $http_request  = "POST $path HTTP/1.0\r\n";
   $http_request .= "Host: $host\r\n";
   $http_request .= "Content-Type: application/x-www-form-urlencoded\r\n";
   $http_request .= "Content-Length: " . strlen(utf8_decode($request)) . "\r\n";
   $http_request .= "User-Agent: AtD/0.1\r\n";
   $http_request .= "\r\n";
   $http_request .= utf8_decode($request);            

   $response = '';                 
   if( false != ( $fs = @fsockopen($host, $port, $errno, $errstr, 10) ) ) 
   {                 
      fwrite($fs, $http_request);

      while ( !feof($fs) )
      {
          $response .= fgets($fs);
      }
      fclose($fs);
      $response = explode("\r\n\r\n", $response, 2);
   }
   return $response;
}

require("cssencode.php");

if (strcmp($language, 'en') == 0 || strcmp($language, 'de') == 0 || strcmp($language, 'es') == 0 || strcmp($language, 'fr') == 0 || strcmp($language, 'pt') == 0)
	$host = $language . '.service.afterthedeadline.com';
else
	$host = 'service.afterthedeadline.com';

$data = AtD_http_post(str_replace("\\'", "'", $postText), $host, $url);
header("Content-Type: text/css");
echo encode_css($data[1]);
?>
