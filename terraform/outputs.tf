output "elastic_ip" {
  description = "Stable Elastic IP address of the server"
  value       = aws_eip.medical_eip.public_ip
}

output "frontend_url" {
  description = "React frontend served by nginx"
  value       = "http://${aws_eip.medical_eip.public_ip}"
}

output "backend_url" {
  description = "Django backend direct access (Gunicorn)"
  value       = "http://${aws_eip.medical_eip.public_ip}:8000"
}

output "api_proxy_url" {
  description = "API through nginx reverse proxy (same origin as frontend)"
  value       = "http://${aws_eip.medical_eip.public_ip}/api"
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.medical_app.id
}

output "ssh_command" {
  description = "SSH command to connect to the server"
  value       = "ssh -i labsuser.pem ubuntu@${aws_eip.medical_eip.public_ip}"
}

output "bootstrap_log" {
  description = "Command to tail bootstrap logs via SSH"
  value       = "ssh -i labsuser.pem ubuntu@${aws_eip.medical_eip.public_ip} 'sudo tail -f /var/log/medical-bootstrap.log'"
}
