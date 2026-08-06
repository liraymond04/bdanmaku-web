import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const vods = sqliteTable('vods', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	youtubeUrl: text('youtube_url').notNull(),
	youtubeId: text('youtube_id').notNull(),
	description: text('description'),
	thumbnailUrl: text('thumbnail_url'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
});

export const uploads = sqliteTable('uploads', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	vodId: integer('vod_id').references(() => vods.id, { onDelete: 'cascade' }).notNull(),
	bilibiliUrl: text('bilibili_url').notNull(),
	bilibiliBv: text('bilibili_bv').notNull(),
	timingOffsetMs: integer('timing_offset_ms').notNull().default(0),
	assFilePath: text('ass_file_path'),
	status: text('status').notNull().default('pending'),
	sourceLabel: text('source_label'),
	sourceNote: text('source_note'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
});

export const danmakuLines = sqliteTable('danmaku_lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	uploadId: integer('upload_id').references(() => uploads.id, { onDelete: 'cascade' }).notNull(),
	layer: integer('layer').notNull().default(0),
	startMs: integer('start_ms').notNull(),
	endMs: integer('end_ms').notNull(),
	originalText: text('original_text').notNull(),
	translatedText: text('translated_text'),
	editedText: text('edited_text'),
	note: text('note'),
	noteMarkdown: text('note_markdown'),
	positionType: text('position_type').notNull(),
	posX: real('pos_x'),
	posY: real('pos_y'),
	posX2: real('pos_x2'),
	posY2: real('pos_y2'),
	anchor: integer('anchor'),
	fontSize: integer('font_size'),
	translatedFontSize: integer('translated_font_size'),
	color: text('color'),
	styleTags: text('style_tags'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
});

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: text('created_at').notNull(),
});
