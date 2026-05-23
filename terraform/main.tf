terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.3.0"
}

provider "aws" {
  region = var.aws_region
}

# Ubuntu 24.04 LTS (Noble) — Canonical official AMI
data "aws_ami" "ubuntu_24" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Allocate Elastic IP before instance so its address can be injected into user_data
resource "aws_eip" "medical_eip" {
  domain = "vpc"

  tags = {
    Name    = "medical-app-eip"
    Project = "medical-pipeline"
  }
}

resource "aws_instance" "medical_app" {
  ami                    = data.aws_ami.ubuntu_24.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.medical_sg.id]

  user_data = templatefile("user_data.sh", {
    backend_script      = file("install/backend.sh")
    frontend_script     = file("install/frontend.sh")
    db_app_password     = var.db_app_password
    mysql_root_password = var.mysql_root_password
    elastic_ip          = aws_eip.medical_eip.public_ip
  })

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # Ne jamais recreer l'instance a cause d'un changement d'AMI ou de user_data :
  # - ami      : Canonical publie de nouveaux AMIs regulierement ; cela ne doit pas
  #              declencher une destruction/recreation silencieuse de la VM.
  # - user_data: le bootstrap ne s'execute qu'au premier demarrage ; les mises a jour
  #              applicatives passent par setup.sh (Job 3-4), pas par user_data.
  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = {
    Name        = "medical-app-server"
    Environment = "production"
    Project     = "medical-pipeline"
  }

  depends_on = [aws_eip.medical_eip]
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.medical_app.id
  allocation_id = aws_eip.medical_eip.id
}
