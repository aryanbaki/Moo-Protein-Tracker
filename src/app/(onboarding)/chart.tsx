import { ComparisonChart } from '../../components/ComparisonChart';
import { OnboardingScaffold, useOnboardingNav } from '../../features/onboarding';

export default function ChartStep() {
  const { next } = useOnboardingNav('chart', { record: false });
  return (
    <OnboardingScaffold
      step="chart"
      title="Here's the big idea"
      subtitle="Guessing drifts. Writing it down keeps you honest, one meal at a time."
      cowLine="I drew this myself. With hooves."
      cowPose="wave"
      cowSize={104}
      onContinue={() => next()}
      continueLabel="Makes sense"
    >
      <ComparisonChart />
    </OnboardingScaffold>
  );
}
