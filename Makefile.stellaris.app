
SUFFIX=-cm4f
VARIANT=cm4f
ENTRY_main=ResetISR

include driverlib/makedefs

CFLAGS+=-std=gnu99 # startup_gcc.c file relies on it
CFLAGS+=-DSTELLARIS # for MicroFlo platform recognition
CFLAGS+=-DPART_TM4C123GH6PM # for hardware pin mapping

all: ${COMPILER}${SUFFIX}
all: ${COMPILER}${SUFFIX}/main.axf

${COMPILER}-cm4f/main.a: ${COMPILER}-cm4f/startup_gcc.o ${COMPILER}-cm4f/main.o
${COMPILER}${SUFFIX}/main.axf: ${COMPILER}-cm4f/main.a driverlib/libdriverlib.a

${COMPILER}${SUFFIX}:
	mkdir -p ${COMPILER}${SUFFIX}

${COMPILER}${SUFFIX}/%.o: %.cpp
	@if [ 'x${VERBOSE}' = x ];                            \
	 then                                                 \
	     echo "  CXX    ${<}";                             \
	 else                                                 \
	     echo ${CXX} ${CFLAGS} -D${COMPILER} -o ${@} ${<}; \
	 fi
	@${CC} ${CFLAGS} -D${COMPILER} -o ${@} ${<}
ifneq ($(findstring CYGWIN, ${os}), )
	@sed -i -r 's/ ([A-Za-z]):/ \/cygdrive\/\1/g' ${@:.o=.d}
endif
