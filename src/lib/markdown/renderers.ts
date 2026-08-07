import MdHeading from './MdHeading.svelte';
import MdParagraph from './MdParagraph.svelte';
import MdLink from './MdLink.svelte';
import MdBlockquote from './MdBlockquote.svelte';
import MdImage from './MdImage.svelte';
import MdList from './MdList.svelte';
import MdCode from './MdCode.svelte';
import MdCodespan from './MdCodespan.svelte';

export const markdownRenderers = {
	heading: MdHeading,
	paragraph: MdParagraph,
	link: MdLink,
	blockquote: MdBlockquote,
	image: MdImage,
	list: MdList,
	code: MdCode,
	codespan: MdCodespan,
} as const;
