<script lang="ts">
	interface Props { text?: string; lang?: string; }
	const { text = '', lang }: Props = $props();
</script>

<div class="my-2 p-2 bg-gray-700 rounded-md">
	<pre class="highlight {lang}"><code>{text}</code></pre>
</div>