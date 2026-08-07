<script lang="ts">
	interface Props { children?: () => any; ordered?: boolean; start?: number; }
	const { children, ordered }: Props = $props();
</script>

{#if ordered}
	<ol class="list-decimal list-inside my-1 pl-2">
		{@render children?.()}
	</ol>
{:else}
	<ul class="list-disc list-inside my-1 pl-2">
		{@render children?.()}
	</ul>
{/if}
