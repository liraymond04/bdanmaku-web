<script lang="ts">
	interface Props { text?: string }
	const { text = '' }: Props = $props();
</script>

<code class="p-1 bg-gray-700 rounded-md text-wrap break-all">
	{text}
</code>
