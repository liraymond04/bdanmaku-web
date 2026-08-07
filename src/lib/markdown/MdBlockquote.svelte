<script lang="ts">
	interface Props { children?: () => any; }
	const { children }: Props = $props();
</script>

<blockquote class="border-l-2 border-gray-500 pl-3 my-1 text-gray-400 italic">
	{@render children?.()}
</blockquote>
