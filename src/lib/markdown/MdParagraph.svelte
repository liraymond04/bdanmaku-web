<script lang="ts">
	interface Props { children?: () => any; }
	const { children }: Props = $props();
</script>

<p class="my-1 leading-relaxed">
	{@render children?.()}
</p>
