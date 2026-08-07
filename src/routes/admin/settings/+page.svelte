<script lang="ts">
	import type { ActionData } from './$types';

	let { form } = $props();
</script>

<svelte:head>
	<title>Account Settings — Admin</title>
</svelte:head>

<div class="max-w-md space-y-6">
	<h1 class="text-2xl font-bold text-white">Account Settings</h1>

	<div class="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-4">
		<h2 class="text-lg font-medium text-white">Change Password</h2>

		{#if form?.error}
			<p class="text-sm text-red-400">{form.error}</p>
		{/if}
		{#if form?.success}
			<p class="text-sm text-green-400">Password changed successfully.</p>
		{/if}

		<form method="POST" action="?/changePassword" class="space-y-3">
			<label class="block">
				<span class="text-xs text-gray-400">Current password</span>
				<input
					type="password"
					name="current"
					required
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-gray-400">New password</span>
				<input
					type="password"
					name="new"
					required
					minlength={4}
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-gray-400">Confirm new password</span>
				<input
					type="password"
					name="confirm"
					required
					minlength={4}
					class="mt-1 w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-white"
				/>
			</label>
			<button type="submit" class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
				Change Password
			</button>
		</form>
	</div>
</div>
