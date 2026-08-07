<script lang="ts">
	interface Props { children?: () => any; href?: string; }
	const { children, href }: Props = $props();
</script>

<a {href} target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">
	{@render children?.()}
</a>
