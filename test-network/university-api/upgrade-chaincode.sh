#!/bin/bash

# Upgrade Chaincode with History Tracking
echo "🔄 Upgrading comprehensive-student-admission chaincode with history tracking..."

# Set environment variables
export PATH=${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

# Set the channel name
CHANNEL_NAME="universitychannel"
CHAINCODE_NAME="comprehensive-student-admission"
CHAINCODE_VERSION="1.1"
CHAINCODE_PATH="../university-api/chaincode"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Chaincode Upgrade Details:${NC}"
echo -e "   Channel: ${YELLOW}${CHANNEL_NAME}${NC}"
echo -e "   Chaincode: ${YELLOW}${CHAINCODE_NAME}${NC}"
echo -e "   Version: ${YELLOW}${CHAINCODE_VERSION}${NC}"
echo -e "   Path: ${YELLOW}${CHAINCODE_PATH}${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "scripts/envVar.sh" ]; then
    echo -e "${RED}❌ Error: Please run this script from the test-network directory${NC}"
    exit 1
fi

# Source environment variables
source scripts/envVar.sh

# Check if network is running
if [ ! -d "organizations/peerOrganizations" ]; then
    echo -e "${RED}❌ Error: Network is not running. Please start the network first.${NC}"
    echo -e "   Run: ${YELLOW}./network.sh up createChannel${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Checking current chaincode version...${NC}"

# Get current chaincode version
CURRENT_VERSION=$(peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME} | awk '{print $3}' | sed 's/,//')
echo -e "   Current version: ${YELLOW}${CURRENT_VERSION}${NC}"

echo -e "${BLUE}📦 Packaging new chaincode version...${NC}"

# Package the chaincode
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ${CHAINCODE_PATH} --lang node --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode packaged successfully${NC}"
else
    echo -e "${RED}❌ Failed to package chaincode${NC}"
    exit 1
fi

echo -e "${BLUE}📥 Installing chaincode on Org1...${NC}"

# Install on Org1
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode installed on Org1 successfully${NC}"
else
    echo -e "${RED}❌ Failed to install chaincode on Org1${NC}"
    exit 1
fi

# Get package ID
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | awk '{print $3}' | sed 's/,//')
echo -e "   Package ID: ${YELLOW}${PACKAGE_ID}${NC}"

echo -e "${BLUE}🔐 Approving chaincode for Org1...${NC}"

# Approve for Org1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id ${PACKAGE_ID} --sequence 2

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode approved for Org1${NC}"
else
    echo -e "${RED}❌ Failed to approve chaincode for Org1${NC}"
    exit 1
fi

echo -e "${BLUE}🔐 Approving chaincode for Org2...${NC}"

# Set environment for Org2
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:9051

# Approve for Org2
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --package-id ${PACKAGE_ID} --sequence 2

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode approved for Org2${NC}"
else
    echo -e "${RED}❌ Failed to approve chaincode for Org2${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Committing chaincode upgrade...${NC}"

# Set environment back to Org1
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:7051

# Commit the upgrade
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CHAINCODE_NAME} --version ${CHAINCODE_VERSION} --sequence 2

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode upgrade committed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to commit chaincode upgrade${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verifying chaincode upgrade...${NC}"

# Query the chaincode to verify it's working
peer chaincode query -C $CHANNEL_NAME -n ${CHAINCODE_NAME} -c '{"Args":["GetStudentStatistics"]}'

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chaincode upgrade verified successfully!${NC}"
else
    echo -e "${RED}❌ Chaincode verification failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Chaincode upgrade completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 New Features Added:${NC}"
echo -e "   ✅ Complete history tracking for all student changes"
echo -e "   ✅ Field-level change tracking (old → new values)"
echo -e "   ✅ User identification for each change"
echo -e "   ✅ Timestamped audit trail"
echo -e "   ✅ History query functions"
echo ""
echo -e "${BLUE}🔄 Next Steps:${NC}"
echo -e "   1. Restart your API server: ${YELLOW}node comprehensive-student-api.js${NC}"
echo -e "   2. Test the history functionality: ${YELLOW}node test-complete-history.js${NC}"
echo -e "   3. Use the frontend to see history tracking in action"
echo ""

# Clean up
rm -f ${CHAINCODE_NAME}.tar.gz

echo -e "${GREEN}✨ Upgrade process completed!${NC}" 