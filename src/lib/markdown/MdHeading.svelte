<script lang="ts">
	interface HeadingProps {
		children?: () => any;
		level?: number;
	}

	const { children, level = 1 }: HeadingProps = $props();
	const size = level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm';
	const weight = level <= 2 ? 'font-semibold' : 'font-medium';
</script>

<h2 class="{size} {weight} text-white mt-2 mb-1">
	{@render children?.()}
</h2>
