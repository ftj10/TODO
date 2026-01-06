import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export function ConfirmDoneDialog(props: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <Typography>Mark “{props.title}” as done?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button variant="contained" onClick={props.onConfirm}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
