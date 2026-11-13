#define _GNU_SOURCE
#include <sys/types.h>
#include <unistd.h>
int chown(const char *p, uid_t o, gid_t g) { return 0; }
int fchown(int fd, uid_t o, gid_t g) { return 0; }
int lchown(const char *p, uid_t o, gid_t g) { return 0; }
