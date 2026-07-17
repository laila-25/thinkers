<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMNode;

class HtmlSanitizer
{
    private const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'];

    public function sanitize(string $html): string
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="utf-8" ?><div>'.$html.'</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $document->getElementsByTagName('div')->item(0);
        if (! $root) {
            return '';
        }
        $this->cleanChildren($root);

        return collect(iterator_to_array($root->childNodes))->map(fn (DOMNode $node) => $document->saveHTML($node))->implode('');
    }

    private function cleanChildren(DOMNode $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $node) {
            if ($node instanceof DOMElement) {
                $tag = strtolower($node->tagName);
                if (! in_array($tag, self::ALLOWED_TAGS, true)) {
                    if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math'], true)) {
                        $parent->removeChild($node);
                        continue;
                    }
                    while ($node->firstChild) {
                        $parent->insertBefore($node->firstChild, $node);
                    }
                    $parent->removeChild($node);
                    continue;
                }
                foreach (iterator_to_array($node->attributes) as $attribute) {
                    $name = strtolower($attribute->name);
                    if ($tag !== 'a' || ! in_array($name, ['href', 'title'], true)) {
                        $node->removeAttribute($attribute->name);
                    }
                }
                if ($tag === 'a') {
                    $href = trim($node->getAttribute('href'));
                    if ($href !== '' && ! preg_match('/^(https?:\/\/|mailto:|\/|#)/i', $href)) {
                        $node->removeAttribute('href');
                    }
                    $node->setAttribute('rel', 'noopener noreferrer nofollow');
                }
                $this->cleanChildren($node);
            }
        }
    }
}
