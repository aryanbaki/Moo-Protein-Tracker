import { ComparisonChart } from '../../components/ComparisonChart';
import { OnboardingScaffold, useOnboardingNav } from '../../features/onboarding';

export default function ChartStep() {
  const { next } = useOnboardingNav('chart', { record: false });
  return (
    <OnboardingScaffold step="chart" title="Tracking vs guessing" cowPose="chew" cowSize={250} onContinue={() => next()}>
      {/* The screen title is the chart's title. */}
      <ComparisonChart title={null} />
    </OnboardingScaffold>
  );
}
