// Force IPv4 DNS resolution for Render and other platforms
// This fixes issues with external APIs (geocoding, payment gateways, etc.)
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
