import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useComplaints } from '../contexts/ComplaintContext';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
} from '@mui/material';
import { Send } from '@mui/icons-material';

const SubmitComplaint = () => {
  const { user } = useAuth();
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const [responseMessage, setResponseMessage] = useState(null);
  const [responseType, setResponseType] = useState("success");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await addComplaint({
      title,
      description,
      location,
      category,
    });

    if (result.success) {
      setResponseMessage("Complaint submitted successfully!");
      setResponseType("success");

      setTimeout(() => navigate("/dashboard"), 2000);
    } else {
      setResponseMessage(result.error || "Error submitting complaint");
      setResponseType("error");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Submit New Complaint
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              <TextField
                label="Complaint Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />

              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                required
              >
                <MenuItem value="Water">Water Supply</MenuItem>
                <MenuItem value="Electricity">Electricity</MenuItem>
                <MenuItem value="Sanitation">Sanitation</MenuItem>
                <MenuItem value="Roads">Roads & Infrastructure</MenuItem>
                <MenuItem value="General">General</MenuItem>
              </TextField>

              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={5}
                required
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={<Send />}
                  sx={{ flex: 1 }}
                >
                  {loading ? "Submitting..." : "Submit Complaint"}
                </Button>

                <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </Box>

            </Box>
          </form>

          {responseMessage && (
            <Box mt={3}>
              <Alert severity={responseType}>{responseMessage}</Alert>
            </Box>
          )}

        </Paper>
      </Container>
    </DashboardLayout>
  );
};

export default SubmitComplaint;
