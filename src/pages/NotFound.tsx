import Button from '../components/Button';
import PageIntro from '../components/PageIntro';

export default function NotFound() {
  return (
    <PageIntro eyebrow="404" title="PAGE NOT FOUND" description="We couldn't find that page.">
      <Button to="/">Back home</Button>
    </PageIntro>
  );
}
