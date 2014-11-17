/***************************************************************************** 
 * MicroFlo - Flow-Based Programming for microcontrollers
 * Copyright (c) 2013 Jon Nordby <jononor@gmail.com>
 * MicroFlo may be freely distributed under the MIT license
 *
 * Note: Some libraries used in components may be of different license.
 * 
 * ----------------------------------------------------------------------------
 * This CPP file also serves to build a separate component library object file.
 * (see Makefile build-microflo-complib target)
 * ----------------------------------------------------------------------------
 * 
 *****************************************************************************/

// microflo runtime base class declarations and generated component id's (derived from components.json)
#include "components.h"

// Component Id constants
#include "components-gen.h"

// get generated component input & outport port definitions (derived from components.json)
#include "components-gen-top.hpp"

// all component implementations (through #INCLUDE collection)
#include "components-gen-lib.hpp"

// createComponent() factory function
#include "components-gen-bottom.hpp"
