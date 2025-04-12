#!/bin/bash
# Documentation Generation Script
# Generates documentation from code comments and configuration files
# Usage: ./generate_docs.sh [output_dir]

# Set variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${1:-$PROJECT_ROOT/docs/generated}"
TEMP_DIR="/tmp/thiqax-docs"

# Function to check required tools
check_requirements() {
  local requirements=("jsdoc" "markdown" "node")
  for req in "${requirements[@]}"; do
    if ! command -v "$req" &> /dev/null; then
      echo "Error: $req is required but not installed."
      exit 1
    fi
  done
}

# Function to create directory structure
create_directories() {
  echo "Creating directory structure..."
  mkdir -p "$OUTPUT_DIR"
  mkdir -p "$OUTPUT_DIR/api"
  mkdir -p "$OUTPUT_DIR/config"
  mkdir -p "$OUTPUT_DIR/scripts"
  mkdir -p "$TEMP_DIR"
}

# Function to generate API documentation from JSDoc comments
generate_api_docs() {
  echo "Generating API documentation..."
  
  # Generate JSDoc configuration
  cat > "$TEMP_DIR/jsdoc.json" << EOF
{
  "source": {
    "include": ["$PROJECT_ROOT/src"],
    "includePattern": ".+\\.js(x)?$",
    "excludePattern": "(node_modules/|docs/|dist/)"
  },
  "plugins": ["plugins/markdown"],
  "opts": {
    "destination": "$OUTPUT_DIR/api",
    "recurse": true,
    "template": "node_modules/docdash"
  },
  "templates": {
    "cleverLinks": true,
    "monospaceLinks": true
  }
}
EOF

  # Run JSDoc
  jsdoc -c "$TEMP_DIR/jsdoc.json"
  
  # Generate API index
  echo "# API Documentation" > "$OUTPUT_DIR/api/README.md"
  echo "" >> "$OUTPUT_DIR/api/README.md"
  echo "Generated on $(date)" >> "$OUTPUT_DIR/api/README.md"
  echo "" >> "$OUTPUT_DIR/api/README.md"
  echo "## Modules" >> "$OUTPUT_DIR/api/README.md"
  
  # Create links to modules
  find "$OUTPUT_DIR/api" -name "*.html" | sort | while read -r file; do
    name=$(basename "$file" .html)
    if [[ "$name" != "index" && "$name" != "global" ]]; then
      echo "- [$name](./${name}.html)" >> "$OUTPUT_DIR/api/README.md"
    fi
  done
}

# Function to generate configuration documentation
generate_config_docs() {
  echo "Generating configuration documentation..."
  
  # Document .env.example
  if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
    echo "# Environment Variables Reference" > "$OUTPUT_DIR/config/environment.md"
    echo "" >> "$OUTPUT_DIR/config/environment.md"
    echo "Generated on $(date)" >> "$OUTPUT_DIR/config/environment.md"
    echo "" >> "$OUTPUT_DIR/config/environment.md"
    echo '```' >> "$OUTPUT_DIR/config/environment.md"
    cat "$PROJECT_ROOT/.env.example" >> "$OUTPUT_DIR/config/environment.md"
    echo '```' >> "$OUTPUT_DIR/config/environment.md"
    
    # Extract variables and add descriptions
    echo "" >> "$OUTPUT_DIR/config/environment.md"
    echo "## Variables Description" >> "$OUTPUT_DIR/config/environment.md"
    echo "" >> "$OUTPUT_DIR/config/environment.md"
    
    grep -v '^#' "$PROJECT_ROOT/.env.example" | grep '=' | while read -r line; do
      variable=$(echo "$line" | cut -d= -f1)
      echo "### $variable" >> "$OUTPUT_DIR/config/environment.md"
      
      # Try to find description in comments above the variable
      description=$(grep -B 1 "$variable" "$PROJECT_ROOT/.env.example" | grep '^#' | sed 's/^# //')
      if [[ -n "$description" ]]; then
        echo "$description" >> "$OUTPUT_DIR/config/environment.md"
      else
        echo "No description available." >> "$OUTPUT_DIR/config/environment.md"
      fi
      echo "" >> "$OUTPUT_DIR/config/environment.md"
    done
  fi
  
  # Document nginx.conf
  if [[ -f "$PROJECT_ROOT/nginx.conf" ]]; then
    echo "# Nginx Configuration Reference" > "$OUTPUT_DIR/config/nginx.md"
    echo "" >> "$OUTPUT_DIR/config/nginx.md"
    echo "Generated on $(date)" >> "$OUTPUT_DIR/config/nginx.md"
    echo "" >> "$OUTPUT_DIR/config/nginx.md"
    echo '```nginx' >> "$OUTPUT_DIR/config/nginx.md"
    cat "$PROJECT_ROOT/nginx.conf" >> "$OUTPUT_DIR/config/nginx.md"
    echo '```' >> "$OUTPUT_DIR/config/nginx.md"
  fi
  
  # Document prometheus.yml
  if [[ -f "$PROJECT_ROOT/prometheus.yml" ]]; then
    echo "# Prometheus Configuration Reference" > "$OUTPUT_DIR/config/prometheus.md"
    echo "" >> "$OUTPUT_DIR/config/prometheus.md"
    echo "Generated on $(date)" >> "$OUTPUT_DIR/config/prometheus.md"
    echo "" >> "$OUTPUT_DIR/config/prometheus.md"
    echo '```yaml' >> "$OUTPUT_DIR/config/prometheus.md"
    cat "$PROJECT_ROOT/prometheus.yml" >> "$OUTPUT_DIR/config/prometheus.md"
    echo '```' >> "$OUTPUT_DIR/config/prometheus.md"
  fi
  
  # Document filebeat.yml
  if [[ -f "$PROJECT_ROOT/filebeat.yml" ]]; then
    echo "# Filebeat Configuration Reference" > "$OUTPUT_DIR/config/filebeat.md"
    echo "" >> "$OUTPUT_DIR/config/filebeat.md"
    echo "Generated on $(date)" >> "$OUTPUT_DIR/config/filebeat.md"
    echo "" >> "$OUTPUT_DIR/config/filebeat.md"
    echo '```yaml' >> "$OUTPUT_DIR/config/filebeat.md"
    cat "$PROJECT_ROOT/filebeat.yml" >> "$OUTPUT_DIR/config/filebeat.md"
    echo '```' >> "$OUTPUT_DIR/config/filebeat.md"
  fi
}

# Function to document scripts
document_scripts() {
  echo "Generating script documentation..."
  
  echo "# Scripts Reference" > "$OUTPUT_DIR/scripts/README.md"
  echo "" >> "$OUTPUT_DIR/scripts/README.md"
  echo "Generated on $(date)" >> "$OUTPUT_DIR/scripts/README.md"
  echo "" >> "$OUTPUT_DIR/scripts/README.md"
  
  find "$PROJECT_ROOT/scripts" -name "*.sh" | sort | while read -r script; do
    script_name=$(basename "$script")
    echo "## $script_name" >> "$OUTPUT_DIR/scripts/README.md"
    
    # Extract description from script header
    description=$(grep -A 10 '^#' "$script" | grep -v '^#!' | grep '^#' | head -n 5 | sed 's/^# //')
    if [[ -n "$description" ]]; then
      echo "$description" >> "$OUTPUT_DIR/scripts/README.md"
    else
      echo "No description available." >> "$OUTPUT_DIR/scripts/README.md"
    fi
    
    # Extract usage information
    usage=$(grep -A 3 'Usage:' "$script" | grep -v 'Usage:' | head -n 1 | sed 's/^# //')
    if [[ -n "$usage" ]]; then
      echo "" >> "$OUTPUT_DIR/scripts/README.md"
      echo "**Usage:**" >> "$OUTPUT_DIR/scripts/README.md"
      echo '```bash' >> "$OUTPUT_DIR/scripts/README.md"
      echo "$usage" >> "$OUTPUT_DIR/scripts/README.md"
      echo '```' >> "$OUTPUT_DIR/scripts/README.md"
    fi
    
    echo "" >> "$OUTPUT_DIR/scripts/README.md"
  done
}

# Function to generate infrastructure component documentation
generate_component_docs() {
  echo "Generating infrastructure component documentation..."
  
  # Components and their descriptions
  declare -A components=(
    ["environment_config"]="Environment Configuration Management"
    ["database"]="Database Management"
    ["ssl"]="SSL Certificate Management"
    ["elk"]="ELK Stack Configuration"
    ["deployment"]="Deployment Automation"
    ["monitoring"]="Performance and Monitoring"
    ["security"]="Security Management"
    ["cicd"]="CI/CD Integration"
    ["documentation"]="Documentation"
    ["testing"]="Testing Framework"
  )
  
  echo "# Infrastructure Components" > "$OUTPUT_DIR/components.md"
  echo "" >> "$OUTPUT_DIR/components.md"
  echo "Generated on $(date)" >> "$OUTPUT_DIR/components.md"
  echo "" >> "$OUTPUT_DIR/components.md"
  
  for component in "${!components[@]}"; do
    echo "## ${components[$component]}" >> "$OUTPUT_DIR/components.md"
    
    # Check if component directory exists
    if [[ -d "$PROJECT_ROOT/components/$component" ]]; then
      # Look for README.md in component directory
      if [[ -f "$PROJECT_ROOT/components/$component/README.md" ]]; then
        cat "$PROJECT_ROOT/components/$component/README.md" >> "$OUTPUT_DIR/components.md"
      else
        echo "No detailed documentation available for this component." >> "$OUTPUT_DIR/components.md"
      fi
    else
      echo "Component implementation not found." >> "$OUTPUT_DIR/components.md"
    fi
    
    echo "" >> "$OUTPUT_DIR/components.md"
  done
}

# Function to generate main index file
generate_index() {
  echo "Generating documentation index..."
  
  echo "# ThiQaX Platform Infrastructure Documentation" > "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "Generated on $(date)" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## Contents" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "- [Infrastructure Components](components.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [API Documentation](api/README.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [Configuration Reference](config/)" >> "$OUTPUT_DIR/index.md"
  echo "- [Scripts Reference](scripts/README.md)" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "## Project Overview" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "The ThiQaX Platform Infrastructure consists of 10 components that provide a robust foundation for the ThiQaX Trust Recruitment Platform." >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "### Quick Links" >> "$OUTPUT_DIR/index.md"
  echo "" >> "$OUTPUT_DIR/index.md"
  echo "- [Installation Guide](../INSTALL.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [Configuration Guide](../CONFIG.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [API Documentation](../API.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [Troubleshooting Guide](../TROUBLESHOOTING.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [Deployment Procedures](../DEPLOYMENT.md)" >> "$OUTPUT_DIR/index.md"
  echo "- [Maintenance Procedures](../MAINTENANCE.md)" >> "$OUTPUT_DIR/index.md"
}

# Function to create PDF documentation
create_pdf_docs() {
  if command -v pandoc &> /dev/null && command -v wkhtmltopdf &> /dev/null; then
    echo "Generating PDF documentation..."
    
    # Combine markdown files
    cat "$OUTPUT_DIR/index.md" > "$TEMP_DIR/combined.md"
    echo "\n\pagebreak\n" >> "$TEMP_DIR/combined.md"
    cat "$OUTPUT_DIR/components.md" >> "$TEMP_DIR/combined.md"
    echo "\n\pagebreak\n" >> "$TEMP_DIR/combined.md"
    
    # Add config files
    if [[ -f "$OUTPUT_DIR/config/environment.md" ]]; then
      cat "$OUTPUT_DIR/config/environment.md" >> "$TEMP_DIR/combined.md"
      echo "\n\pagebreak\n" >> "$TEMP_DIR/combined.md"
    fi
    
    if [[ -f "$OUTPUT_DIR/config/nginx.md" ]]; then
      cat "$OUTPUT_DIR/config/nginx.md" >> "$TEMP_DIR/combined.md"
      echo "\n\pagebreak\n" >> "$TEMP_DIR/combined.md"
    fi
    
    # Add scripts documentation
    if [[ -f "$OUTPUT_DIR/scripts/README.md" ]]; then
      cat "$OUTPUT_DIR/scripts/README.md" >> "$TEMP_DIR/combined.md"
      echo "\n\pagebreak\n" >> "$TEMP_DIR/combined.md"
    fi
    
    # Convert to PDF
    pandoc "$TEMP_DIR/combined.md" -o "$OUTPUT_DIR/ThiQaX_Infrastructure_Documentation.pdf" --pdf-engine=wkhtmltopdf
    
    echo "PDF documentation created at $OUTPUT_DIR/ThiQaX_Infrastructure_Documentation.pdf"
  else
    echo "Skipping PDF generation: pandoc or wkhtmltopdf not installed"
  fi
}

# Function to clean up
cleanup() {
  echo "Cleaning up temporary files..."
  rm -rf "$TEMP_DIR"
}

# Main execution
main() {
  echo "ThiQaX Infrastructure Documentation Generator"
  echo "=============================================="
  echo ""
  
  check_requirements
  create_directories
  generate_api_docs
  generate_config_docs
  document_scripts
  generate_component_docs
  generate_index
  create_pdf_docs
  cleanup
  
  echo ""
  echo "Documentation generated successfully at $OUTPUT_DIR"
}

# Run main function
main
