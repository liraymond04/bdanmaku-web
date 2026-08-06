<script lang="ts">
	import type { ActionData } from './$types';

	let { form } = $props();
</script>

<svelte:head>
	<title>Admin Login — bdanmaku</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
	<div class="w-full max-w-sm rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
		<h1 class="text-xl font-bold text-white">Admin Login</h1>

		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="text-sm text-green-400">Logged in. <a href="/admin" class="underline">Go to dashboard</a></p>
		{/if}

		<form method="POST" action="?/login" class="space-y-3">
			<label class="block">
				<span class="text-xs text-gray-400">Username</span>
				<input
					type="text"
					name="username"
					required
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-gray-400">Password</span>
				<input
					type="password"
					name="password"
					required
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				/>
			</label>
			<button type="submit" class="cursor-pointer w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
				Login
			</button>
		</form>
	</div>
</div>
