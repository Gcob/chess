<?php

namespace ChessApp\services;

class Webpack
{
    // needs to be the same as .setManifestKeyPrefix('assets/') declared in the webpack config.
    public const MANIFEST_KEY_PREFIX = "/";
    public const BUILD_DIR = __DIR__ . "/../../public";
    public const BUILD_DIR_URL = "public";

    private static ?array $entrypoints_data = null;
    private static ?array $manifest_data = null;

    public static function get_entrypoints_data(): array
    {
        if (self::$entrypoints_data == null) {
            self::$entrypoints_data = self::get_json_file_data("entrypoints.json")["entrypoints"];
        }

        return self::$entrypoints_data;
    }

    public static function get_manifest_data(): array
    {
        if (self::$manifest_data == null) {
            self::$manifest_data = self::get_json_file_data("manifest.json");
        }

        return self::$manifest_data;
    }

    private static function get_json_file_data(string $file): array
    {
        $file = self::BUILD_DIR . "/" . $file;

        if (!file_exists($file)) {
            trigger_error("Please build te assets or serve them.", E_USER_ERROR);
        }

        $json_string = file_get_contents($file);

        return self::$entrypoints_data = json_decode(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $json_string), true);
    }

    public static function get_entrypoint(string $entry_name): array
    {
        return self::get_entrypoints_data()[$entry_name];
    }

    public static function echo_entry_assets(string $entry_name): void
    {
        foreach (self::get_entrypoint($entry_name)["js"] ?? [] as $js_file) {
            ?>
            <script src="<?= $js_file ?>"></script>
            <?php
        }

        foreach (self::get_entrypoint($entry_name)["css"] ?? [] as $css_file) {
            ?>
            <link rel="stylesheet" href="<?= $css_file ?>" />
            <?php
        }
    }

    public static function get_asset_url(string $resources_dir_relative_path): string
    {

        $manifest_key = self::MANIFEST_KEY_PREFIX . $resources_dir_relative_path;

        if (!isset(self::get_manifest_data()[$manifest_key])) {
            trigger_error(sprintf("Cannot get asset url from '%s'. Does the file exists? If so, the problem might be from webpack configuration.", $manifest_key), E_USER_WARNING);
        }

        return self::get_manifest_data()[$manifest_key] ?? "";
    }
}