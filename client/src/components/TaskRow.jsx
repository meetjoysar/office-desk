import DueChip from './DueChip';
import StatusControl from './StatusControl';

export default function TaskRow({ task, showPerson = false, onStatus, children }) {
  const self = task.assignedBy?._id === task.assignedTo?._id;
  return (
    <div className="task-row">
      <div className="grow">
        <strong>{task.workName}</strong>
        <div className="hint">
          {task.client?.name} ·{' '}
          {showPerson
            ? task.assignedTo?.shortName
            : `given by ${self ? 'Self' : task.assignedBy?.shortName}`}
        </div>
      </div>
      <DueChip task={task} />
      <StatusControl value={task.status} onChange={(s) => onStatus(task, s)} />
      {children}
    </div>
  );
}