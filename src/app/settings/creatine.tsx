import { formatTime12, shiftTime, syncReminders } from '../../features/reminders';
import { Group, Note, SettingsScreen, Stepper, ToggleRow } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';
import type { CreatineSettings } from '../../types';

const MIN_DOSE = 1;
const MAX_DOSE = 10;
const DEFAULT_TIME = '09:00';

export default function CreatineSettingsScreen() {
  const creatine = useProfile((s) => s.creatine);

  const update = (patch: Partial<CreatineSettings>) => {
    useProfile.getState().setCreatine(patch);
    void syncReminders();
  };
  const dose = Math.min(MAX_DOSE, Math.max(MIN_DOSE, Math.round(creatine.doseG)));
  const time = creatine.reminderTime;

  return (
    <SettingsScreen title="Creatine">
      <Group>
        <ToggleRow label="Track creatine" value={creatine.enabled} onChange={(enabled) => update({ enabled })} />
      </Group>

      {creatine.enabled ? (
        <>
          <Group>
            <Stepper
              label="Dose"
              valueText={`${dose} g`}
              decLabel="Decrease dose by 1 gram"
              incLabel="Increase dose by 1 gram"
              onDec={() => update({ doseG: Math.max(MIN_DOSE, dose - 1) })}
              onInc={() => update({ doseG: Math.min(MAX_DOSE, dose + 1) })}
            />
          </Group>

          <Group>
            <ToggleRow label="Reminder" accessibilityLabel="Daily reminder" value={!!time} onChange={(on) => update({ reminderTime: on ? DEFAULT_TIME : null })} />
            {time ? (
              <Stepper label="Hour" valueText={formatTime12(time)} decLabel="One hour earlier" incLabel="One hour later" onDec={() => update({ reminderTime: shiftTime(time, -60) })} onInc={() => update({ reminderTime: shiftTime(time, 60) })} />
            ) : null}
            {time ? (
              <Stepper label="Minutes" valueText={`:${time.slice(3)}`} decLabel="Five minutes earlier" incLabel="Five minutes later" onDec={() => update({ reminderTime: shiftTime(time, -5) })} onInc={() => update({ reminderTime: shiftTime(time, 5) })} />
            ) : null}
          </Group>
        </>
      ) : null}

      <Note>Not medical advice.</Note>
    </SettingsScreen>
  );
}
