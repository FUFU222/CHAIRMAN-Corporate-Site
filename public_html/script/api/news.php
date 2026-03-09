<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    respondJson(['error' => 'Method Not Allowed'], 405);
}

try {
    $config = loadMicrocmsConfig();
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'home':
            $home = microcmsRequest($config, 'blog', [
                'limit' => 3,
                'orders' => '-publishedAt',
            ]);

            respondJson([
                'contents' => array_map('mapHomeArticle', $home['contents'] ?? []),
            ]);
            break;

        case 'list':
            $list = microcmsRequest($config, 'blog', [
                'limit' => 100,
                'orders' => '-publishedAt',
            ]);

            respondJson([
                'contents' => array_map('mapListArticle', $list['contents'] ?? []),
            ]);
            break;

        case 'detail':
            $articleId = sanitizeContentId($_GET['id'] ?? '');
            if ($articleId === '') {
                respondJson(['error' => 'Invalid article id'], 400);
            }

            $detail = microcmsRequest($config, 'blog/' . rawurlencode($articleId));
            $article = mapDetailArticle($detail);

            $relatedArticles = [];
            $categoryId = $article['categories'][0]['id'] ?? null;
            if (is_string($categoryId) && $categoryId !== '') {
                $related = microcmsRequest($config, 'blog', [
                    'filters' => 'category[contains]' . $categoryId,
                    'limit' => 4,
                    'orders' => '-publishedAt',
                ]);

                foreach ($related['contents'] ?? [] as $item) {
                    if (($item['id'] ?? '') === $articleId) {
                        continue;
                    }

                    $relatedArticles[] = mapListArticle($item);
                    if (count($relatedArticles) >= 3) {
                        break;
                    }
                }
            }

            $latest = microcmsRequest($config, 'blog', [
                'limit' => 3,
                'orders' => '-publishedAt',
            ]);

            respondJson([
                'content' => $article,
                'related' => $relatedArticles,
                'latest' => array_map('mapListArticle', $latest['contents'] ?? []),
            ]);
            break;

        default:
            respondJson(['error' => 'Invalid action'], 400);
    }
} catch (Throwable $error) {
    error_log('[microcms-api] ' . $error->getMessage());
    respondJson(['error' => 'Failed to load CMS data'], 500);
}

function loadMicrocmsConfig(): array
{
    $configPath = dirname(__DIR__, 3) . '/config_private/microcms.php';
    if (is_file($configPath)) {
        $config = require $configPath;
        if (
            is_array($config) &&
            !empty($config['service_domain']) &&
            !empty($config['api_key'])
        ) {
            return $config;
        }
    }

    $serviceDomain = getenv('MICROCMS_SERVICE_DOMAIN') ?: '';
    $apiKey = getenv('MICROCMS_API_KEY') ?: '';

    if ($serviceDomain !== '' && $apiKey !== '') {
        return [
            'service_domain' => $serviceDomain,
            'api_key' => $apiKey,
        ];
    }

    throw new RuntimeException('MicroCMS config is missing');
}

function microcmsRequest(array $config, string $endpoint, array $query = []): array
{
    $serviceDomain = trim((string) ($config['service_domain'] ?? ''));
    $apiKey = trim((string) ($config['api_key'] ?? ''));

    if (!preg_match('/^[a-z0-9-]+$/', $serviceDomain)) {
        throw new RuntimeException('Invalid service domain');
    }

    if ($apiKey === '') {
        throw new RuntimeException('Missing API key');
    }

    $url = 'https://' . $serviceDomain . '.microcms.io/api/v1/' . ltrim($endpoint, '/');
    if ($query !== []) {
        $url .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    $headers = [
        'Accept: application/json',
        'X-MICROCMS-API-KEY: ' . $apiKey,
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($body === false) {
            $message = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('cURL error: ' . $message);
        }

        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", $headers),
                'timeout' => 10,
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        $status = 0;

        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $status = (int) $matches[1];
        }

        if ($body === false) {
            throw new RuntimeException('HTTP request failed');
        }
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('MicroCMS returned status ' . $status);
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid JSON response from MicroCMS');
    }

    return $decoded;
}

function mapHomeArticle(array $item): array
{
    return [
        'id' => (string) ($item['id'] ?? ''),
        'title' => (string) ($item['title'] ?? ''),
        'publishedAt' => (string) ($item['publishedAt'] ?? ''),
        'excerpt' => buildExcerpt((string) ($item['content'] ?? ''), 40),
        'eyecatch' => mapEyecatch($item['eyecatch'] ?? null),
    ];
}

function mapListArticle(array $item): array
{
    return [
        'id' => (string) ($item['id'] ?? ''),
        'title' => (string) ($item['title'] ?? ''),
        'publishedAt' => (string) ($item['publishedAt'] ?? ''),
        'eyecatch' => mapEyecatch($item['eyecatch'] ?? null),
        'categories' => array_map('mapCategory', normalizeCategories($item['category'] ?? [])),
    ];
}

function mapDetailArticle(array $item): array
{
    $author = is_array($item['author'] ?? null) ? $item['author'] : [];

    return [
        'id' => (string) ($item['id'] ?? ''),
        'title' => (string) ($item['title'] ?? ''),
        'publishedAt' => (string) ($item['publishedAt'] ?? ''),
        'content' => (string) ($item['content'] ?? ''),
        'description' => (string) ($item['description'] ?? ''),
        'eyecatch' => mapEyecatch($item['eyecatch'] ?? null),
        'categories' => array_map('mapCategory', normalizeCategories($item['category'] ?? [])),
        'author' => [
            'title' => (string) ($author['author-title'] ?? ''),
            'name' => (string) ($author['author-name'] ?? ''),
            'bio' => (string) ($author['author-bio'] ?? ''),
            'imageUrl' => is_array($author['author-image'] ?? null)
                ? (string) ($author['author-image']['url'] ?? '')
                : '',
        ],
    ];
}

function mapEyecatch($eyecatch): array
{
    if (!is_array($eyecatch)) {
        return ['url' => ''];
    }

    return [
        'url' => (string) ($eyecatch['url'] ?? ''),
    ];
}

function normalizeCategories($categories): array
{
    if (!is_array($categories)) {
        return [];
    }

    return array_values(array_filter($categories, 'is_array'));
}

function mapCategory(array $category): array
{
    return [
        'id' => (string) ($category['id'] ?? ''),
        'name' => (string) ($category['name'] ?? ''),
    ];
}

function buildExcerpt(string $html, int $limit): string
{
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/\s+/u', ' ', $text ?? '');
    $text = trim((string) $text);

    if (mb_strlen($text, 'UTF-8') <= $limit) {
        return $text;
    }

    return mb_substr($text, 0, $limit, 'UTF-8') . '...';
}

function sanitizeContentId(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    return preg_match('/^[A-Za-z0-9_-]+$/', $value) === 1 ? $value : '';
}

function respondJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
