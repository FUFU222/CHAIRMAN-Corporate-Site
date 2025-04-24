<?php

class CVersion
{
    /**
     * バージョン文字列を取得する
     * @return string バージョン表記文字列
     */
    public static function getVersionString()
    {
        $version_ini = file_get_contents(dirname(dirname(__FILE__)) . '/config/version.ini');
        $version_ini = str_replace("\r\n", "\n", $version_ini);
        $version_list = explode("\n", $version_ini);
        $version = trim($version_list[1]);
        return $version;
    }
}
