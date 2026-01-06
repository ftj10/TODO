import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export function ConfirmDeleteDialog(props: {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onCancel}>
      <DialogTitle>Confirm</DialogTitle>
      <DialogContent>
        <Typography>Delete “{props.title}”?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={props.onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
