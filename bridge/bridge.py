#!/usr/bin/env python3
import socket

HOST = '127.0.0.1'
PORT = 5555

print('Starting example TCP bridge on %s:%d' % (HOST, PORT))
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, PORT))
    s.listen(1)
    conn, addr = s.accept()
    with conn:
        print('Connected by', addr)
        buffer = ''
        while True:
            data = conn.recv(1024)
            if not data:
                break
            buffer += data.decode('utf-8')
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                if line.strip():
                    print('BRIDGE RECV:', line)
                    # TODO: integrate with your ELS system here
