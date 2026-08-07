<script lang="ts">
	interface Props { href?: string; title?: string; text?: string; }
	const { href: src, title, text }: Props = $props();
</script>

<img {src} alt={text ?? ''} title={title ?? undefined} class="max-w-full rounded my-1" />
