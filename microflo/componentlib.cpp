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

// microflo runtime base class declarations and component base class declarations
#include "components.h"

// generated Component Id constants
#include "componentlib-ids.h"

// generated component input & outport port definitions (derived from components.json)
#include "componentlib-ports.h"

// concatenated source code of all component class implementations and createComponent() factory function 
#include "componentlib-source.hpp"

