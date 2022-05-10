#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GlobephanStack } from '../lib/globe-phan-stack';

const app = new cdk.App();
new GlobephanStack(app, 'GlobephanStack');
