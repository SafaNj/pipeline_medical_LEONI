variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.large"
}

variable "key_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
  default     = "vockey"
}

variable "db_app_password" {
  description = "MySQL password for the medical application database user (medical_user)"
  type        = string
  sensitive   = true
}

variable "mysql_root_password" {
  description = "MySQL root password set during provisioning"
  type        = string
  sensitive   = true
}
